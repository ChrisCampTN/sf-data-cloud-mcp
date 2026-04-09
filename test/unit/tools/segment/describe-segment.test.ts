import { describe, it, expect, vi } from "vitest";
import { describeSegmentTool } from "../../../../src/tools/segment/describe-segment.js";

describe("describeSegmentTool", () => {
  it("fetches segment details", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ apiName: "Test", status: "ACTIVE" })
    };

    const result = await describeSegmentTool(
      { target_org: "HFA-Production", segment_name: "Test" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.apiName).toBe("Test");
  });
});
