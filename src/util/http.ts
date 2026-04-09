import { translateError } from "./errors.js";

interface HttpClientOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export class DataCloudHttpClient {
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(options: HttpClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
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
        await new Promise((r) =>
          setTimeout(r, this.retryDelayMs * Math.pow(2, attempt))
        );
        continue;
      }

      throw new Error(translateError(errorMessage));
    }

    throw lastError ?? new Error("Request failed after retries");
  }
}
