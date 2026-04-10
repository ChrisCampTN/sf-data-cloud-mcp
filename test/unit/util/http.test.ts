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

  it("extracts errorMessage from response body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errorMessage: 'Unrecognized field "type"' })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.post("https://example.com/api/test", "token123", {})
    ).rejects.toThrow('Unrecognized field "type"');
  });

  it("extracts error from array-shaped response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve([{ errorCode: "NOT_FOUND", message: "The requested resource does not exist" }])
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.get("https://example.com/api/test", "token123")
    ).rejects.toThrow("The requested resource does not exist");
  });

  it("extracts error_description from OAuth-style response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "invalid_request", error_description: "invalid subject token" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.get("https://example.com/api/test", "token123")
    ).rejects.toThrow("invalid subject token");
  });

  it("falls back to JSON.stringify for unknown error shapes", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ code: 123, foo: "bar" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.get("https://example.com/api/test", "token123")
    ).rejects.toThrow("foo");
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

  it("paginatedGet: offset fallback with hintBatchSize (zero-signal API like DMOs)", async () => {
    // DMO API returns flat array, no totalSize/batchSize/nextPageUrl
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          dataModelObject: [{ name: "a" }, { name: "b" }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          dataModelObject: [{ name: "c" }]
        })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.paginatedGet(
      "https://example.com/services/data/v66.0/ssot/data-model-objects",
      "token123",
      "dataModelObjects",
      "https://example.com",
      2 // hintBatchSize
    );

    expect(result.items).toHaveLength(3);
    expect(result.items.map(i => i.name)).toEqual(["a", "b", "c"]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toContain("offset=2");
    expect(mockFetch.mock.calls[1][0]).toContain("batchSize=2");
  });

  it("paginatedGet: offset fallback with response totalSize (segments-style API)", async () => {
    // Segments API returns totalSize and batchSize in response
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          segments: [{ name: "a" }, { name: "b" }],
          totalSize: 3,
          batchSize: 2,
          offset: 0
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          segments: [{ name: "c" }],
          totalSize: 3,
          batchSize: 2,
          offset: 2
        })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.paginatedGet(
      "https://example.com/services/data/v66.0/ssot/segments",
      "token123",
      "segments",
      "https://example.com"
    );

    expect(result.items).toHaveLength(3);
    expect(result.totalSize).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toContain("offset=2");
  });

  it("paginatedGet: stops when page is not full and no totalSize", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        dataModelObject: [{ name: "a" }]
      })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.paginatedGet(
      "https://example.com/services/data/v66.0/ssot/data-model-objects",
      "token123",
      "dataModelObjects",
      "https://example.com",
      50
    );

    expect(result.items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
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
