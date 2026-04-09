import { describe, it, expect, vi } from "vitest";
import { listSegmentsTool } from "../../../../src/tools/segment/list-segments.js";
import fixture from "../../../fixtures/segment-list.json";

describe("listSegmentsTool", () => {
  it("returns list of segments", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ segments: fixture })
    };

    const result = await listSegmentsTool(
      { target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(2);
    expect(result[0].apiName).toBe("Test");
  });
});
