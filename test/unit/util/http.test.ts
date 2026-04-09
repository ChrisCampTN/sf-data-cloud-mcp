import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataCloudHttpClient } from "../../../src/util/http.js";

describe("DataCloudHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makes GET request with auth header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.get("https://example.com/api/test", "token123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token123"
        })
      })
    );
    expect(result).toEqual({ data: "test" });
  });

  it("makes POST request with JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ created: true })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.post(
      "https://example.com/api/test",
      "token123",
      { name: "test" }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api/test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ name: "test" })
      })
    );
    expect(result).toEqual({ created: true });
  });

  it("throws translated error on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: "The Definition Type is not supported" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.get("https://example.com/api/test", "token123")
    ).rejects.toThrow("CALCULATED_METRIC");
  });

  it("retries on 429 and 5xx", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map(),
        json: () => Promise.resolve({ message: "rate limited" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "ok" })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient({ retryDelayMs: 1 });
    const result = await client.get("https://example.com/api/test", "token123");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: "ok" });
  });

  it("respects Retry-After header on 429", async () => {
    const headers = new Map([["Retry-After", "1"]]);
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers,
        json: () => Promise.resolve({ message: "rate limited" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "ok" })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient({ retryDelayMs: 1 });
    const result = await client.get("https://example.com/api/test", "token123");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: "ok" });
  });

  it("paginatedGet follows nextPageUrl", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          dataStreams: [{ name: "a" }],
          nextPageUrl: "/services/data/v66.0/ssot/data-streams?offset=1",
          totalSize: 2
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          dataStreams: [{ name: "b" }],
          totalSize: 2
        })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.paginatedGet(
      "https://example.com/services/data/v66.0/ssot/data-streams",
      "token123",
      "dataStreams",
      "https://example.com"
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("a");
    expect(result.items[1].name).toBe("b");
    expect(result.totalSize).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
