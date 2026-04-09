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
   * Paginated GET — follows nextPageUrl to collect all items.
   * Returns the combined unwrapped response.
   */
  async paginatedGet(
    url: string,
    token: string,
    expectedKey: string,
    baseUrl?: string
  ): Promise<UnwrappedResponse> {
    const allItems: Record<string, unknown>[] = [];
    let currentUrl = url;
    let totalSize: number | undefined;
    let pages = 0;

    while (currentUrl && pages < this.maxPages) {
      const raw = await this.get<unknown>(currentUrl, token);
      const page = unwrapResponse(raw, expectedKey);

      allItems.push(...page.items);
      if (page.totalSize !== undefined) totalSize = page.totalSize;

      if (page.nextPageUrl) {
        // nextPageUrl may be relative (e.g. "/services/data/v66.0/ssot/...")
        currentUrl = page.nextPageUrl.startsWith("http")
          ? page.nextPageUrl
          : `${baseUrl}${page.nextPageUrl}`;
      } else if (page.nextPageToken) {
        // Token-based pagination (collection pattern)
        const sep = currentUrl.includes("?") ? "&" : "?";
        currentUrl = `${url}${sep}pageToken=${page.nextPageToken}`;
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
      const errorMessage =
        (errorBody as { message?: string }).message ??
        `HTTP ${response.status}`;

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

function parseRetryAfter(value: string): number {
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  // HTTP-date format
  const date = new Date(value);
  if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return 1000; // fallback
}
