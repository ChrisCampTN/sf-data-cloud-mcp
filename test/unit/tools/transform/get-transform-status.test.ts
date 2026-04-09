import { describe, it, expect, vi } from "vitest";
import { getTransformStatusTool } from "../../../../src/tools/transform/get-transform-status.js";

describe("getTransformStatusTool", () => {
  it("fetches transform status", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ name: "Test", status: "ACTIVE", lastRunStatus: "SUCCESS" })
    };

    const result = await getTransformStatusTool(
      { target_org: "HFA-Production", transform_name: "Test" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.status).toBe("ACTIVE");
  });
});
