import { translateError } from "./errors.js";
import { unwrapResponse, type UnwrappedResponse } from "./unwrap.js";

interface HttpClientOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  maxPages?: number;
}

export class DataCloudHttpClient {
  private maxRetries: number;
  private retryDelayMs: number;
  private maxPages: number;

  constructor(options: HttpClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.maxPages = options.maxPages ?? 20;
  }

  async get<T = unknown>(url: string, token: string): Promise<T> {
    return this.request<T>("GET", url, token);
  }

  async post<T = unknown>(
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>("POST", url, token, body);
  }

  async delete<T = unknown>(url: string, token: string): Promise<T> {
    return this.request<T>("DELETE", url, token);
  }

  async patch<T = unknown>(
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>("PATCH", url, token, body);
  }

  /**
   * Paginated GET — follows nextPageUrl, nextPageToken, or offset to collect all items.
   *
   * Three pagination styles (tried in order):
   * 1. nextPageUrl — follow the URL (data-streams, data-actions)
   * 2. nextPageToken — collection pattern (calculated-insights)
   * 3. Offset-based fallback — when the API returns no pagination signals
   *    but totalSize indicates more items exist, or the page is full.
   *    Page size detection priority: API response batchSize > caller hint > page item count.
   *
   * @param hintBatchSize - Caller-provided page size hint for APIs that return no
   *   pagination signals at all (e.g. DMOs return a flat array capped at 50 with no
   *   totalSize, batchSize, or nextPageUrl).
   */
  async paginatedGet(
    url: string,
    token: string,
    expectedKey: string,
    baseUrl?: string,
    hintBatchSize?: number
  ): Promise<UnwrappedResponse> {
    const allItems: Record<string, unknown>[] = [];
    let currentUrl = url;
    let totalSize: number | undefined;
    let effectiveBatchSize: number | undefined;
    let pages = 0;

    while (currentUrl && pages < this.maxPages) {
      const raw = await this.get<unknown>(currentUrl, token);
      const page = unwrapResponse(raw, expectedKey);

      allItems.push(...page.items);
      if (page.totalSize !== undefined) totalSize = page.totalSize;
      if (page.responseBatchSize !== undefined) effectiveBatchSize = page.responseBatchSize;

      // Resolve the page size: API response > caller hint > page length
      const pageSize = effectiveBatchSize ?? hintBatchSize ?? page.items.length;

      if (page.nextPageUrl) {
        // Style 1: follow nextPageUrl (data-streams, data-actions)
        currentUrl = page.nextPageUrl.startsWith("http")
          ? page.nextPageUrl
          : `${baseUrl}${page.nextPageUrl}`;
      } else if (page.nextPageToken) {
        // Style 2: token-based pagination (calculated-insights collection pattern)
        const sep = currentUrl.includes("?") ? "&" : "?";
        currentUrl = `${url}${sep}pageToken=${page.nextPageToken}`;
      } else if (totalSize !== undefined && allItems.length < totalSize) {
        // Offset fallback: API told us the total, we haven't reached it
        const sep = url.includes("?") ? "&" : "?";
        currentUrl = `${url}${sep}offset=${allItems.length}&batchSize=${pageSize}`;
      } else if (
        totalSize === undefined &&
        page.items.length > 0 &&
        page.items.length >= pageSize
      ) {
        // Offset fallback: no totalSize, page was full — assume more exist
        const sep = url.includes("?") ? "&" : "?";
        currentUrl = `${url}${sep}offset=${allItems.length}&batchSize=${pageSize}`;
      } else {
        break;
      }
      pages++;
    }

    return { items: allItems, totalSize };
  }

  private async request<T>(
    method: string,
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      };
      const init: RequestInit = { method, headers };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);

      if (response.ok) {
        return (await response.json()) as T;
      }

      const errorBody = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage = extractErrorMessage(errorBody, response.status);

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < this.maxRetries
      ) {
        lastError = new Error(errorMessage);
        // Respect Retry-After header if present, otherwise exponential backoff
        const retryAfter = response.headers.get("Retry-After");
        const delayMs = retryAfter
          ? parseRetryAfter(retryAfter)
          : this.retryDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      throw new Error(translateError(errorMessage));
    }

    throw lastError ?? new Error("Request failed after retries");
  }
}

/**
 * Extract error message from various API error response shapes.
 * Data Cloud returns errors in multiple formats depending on the endpoint.
 */
function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === "string") return body;
  if (!body || typeof body !== "object") return `HTTP ${status}`;

  const obj = body as Record<string, unknown>;

  // Shape: { message: "..." }
  if (typeof obj.message === "string" && obj.message) return obj.message;

  // Shape: { errorMessage: "..." }
  if (typeof obj.errorMessage === "string" && obj.errorMessage) return obj.errorMessage;

  // Shape: { detail: "..." }
  if (typeof obj.detail === "string" && obj.detail) return obj.detail;

  // Shape: { error: "...", error_description: "..." }
  if (typeof obj.error_description === "string") return obj.error_description;
  if (typeof obj.error === "string" && obj.error) return obj.error;

  // Shape: [{ message: "..." }] (array of errors)
  if (Array.isArray(body) && body.length > 0) {
    const first = body[0] as Record<string, unknown>;
    if (typeof first.message === "string") return first.message;
    if (typeof first.errorMessage === "string") return first.errorMessage;
  }

  // Shape: { errors: [{ message: "..." }] }
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const first = obj.errors[0] as Record<string, unknown>;
    if (typeof first.message === "string") return first.message;
  }

  // Fallback: stringify the whole body
  try {
    const str = JSON.stringify(body);
    if (str.length <= 500) return str;
    return str.slice(0, 500) + "...";
  } catch {
    return `HTTP ${status}`;
  }
}

function parseRetryAfter(value: string): number {
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  // HTTP-date format
  const date = new Date(value);
  if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return 1000; // fallback
}
