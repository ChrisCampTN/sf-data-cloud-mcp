import { describe, it, expect, vi } from "vitest";
import { describeIdentityResolutionTool } from "../../../../src/tools/identity/describe-identity-resolution.js";

describe("describeIdentityResolutionTool", () => {
  it("fetches identity resolution details", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ label: "Test", status: "PUBLISHED" })
    };

    const result = await describeIdentityResolutionTool(
      { target_org: "HFA-Production", resolution_name: "Test" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.label).toBe("Test");
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("/identity-resolutions/Test"),
      "token"
    );
  });
});
