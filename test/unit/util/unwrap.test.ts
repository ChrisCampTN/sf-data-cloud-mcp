import { describe, it, expect } from "vitest";
import { unwrapResponse } from "../../../src/util/unwrap.js";

describe("unwrapResponse", () => {
  it("unwraps standard plural key (dataStreams)", () => {
    const resp = { dataStreams: [{ name: "a" }], totalSize: 10 };
    const result = unwrapResponse(resp, "dataStreams");
    expect(result.items).toEqual([{ name: "a" }]);
    expect(result.totalSize).toBe(10);
  });

  it("unwraps singular key (dataModelObject)", () => {
    const resp = { dataModelObject: [{ name: "a" }] };
    const result = unwrapResponse(resp, "dataModelObjects");
    expect(result.items).toEqual([{ name: "a" }]);
  });

  it("unwraps collection pattern (calculated-insights)", () => {
    const resp = { collection: { items: [{ apiName: "ci1" }], total: 5 } };
    const result = unwrapResponse(resp, "calculatedInsights");
    expect(result.items).toEqual([{ apiName: "ci1" }]);
    expect(result.totalSize).toBe(5);
  });

  it("handles bare array response", () => {
    const resp = [{ name: "a" }];
    const result = unwrapResponse(resp, "anything");
    expect(result.items).toEqual([{ name: "a" }]);
  });

  it("extracts nextPageUrl when present", () => {
    const resp = { dataStreams: [{ name: "a" }], nextPageUrl: "/next?offset=10", totalSize: 50 };
    const result = unwrapResponse(resp, "dataStreams");
    expect(result.nextPageUrl).toBe("/next?offset=10");
    expect(result.totalSize).toBe(50);
  });

  it("returns empty items for missing key", () => {
    const resp = { somethingElse: "value" };
    const result = unwrapResponse(resp, "dataStreams");
    expect(result.items).toEqual([]);
  });

  it("extracts nextPageToken from collection pattern", () => {
    const resp = { collection: { items: [], nextPageToken: "abc", total: 0 } };
    const result = unwrapResponse(resp, "calculatedInsights");
    expect(result.nextPageToken).toBe("abc");
  });

  it("extracts responseBatchSize when API reports it", () => {
    const resp = { segments: [{ name: "a" }], totalSize: 5, batchSize: 20, offset: 0 };
    const result = unwrapResponse(resp, "segments");
    expect(result.responseBatchSize).toBe(20);
    expect(result.totalSize).toBe(5);
  });

  it("omits responseBatchSize when API returns batchSize: 0", () => {
    const resp = { activations: [], batchSize: 0, offset: 0 };
    const result = unwrapResponse(resp, "activations");
    expect(result.responseBatchSize).toBeUndefined();
  });

  it("omits responseBatchSize when not present", () => {
    const resp = { dataModelObject: [{ name: "a" }] };
    const result = unwrapResponse(resp, "dataModelObjects");
    expect(result.responseBatchSize).toBeUndefined();
  });
});
