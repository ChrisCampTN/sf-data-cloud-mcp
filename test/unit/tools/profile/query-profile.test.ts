import { describe, it, expect, vi } from "vitest";
import { queryProfileTool } from "../../../../src/tools/profile/query-profile.js";

describe("queryProfileTool", () => {
  it("queries unified profile using DC token", async () => {
    const mockAuth = {
      getDataCloudCredentials: vi.fn().mockResolvedValue({
        accessToken: "dc-token",
        instanceUrl: "https://test-org.dc.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ profiles: [] })
    };

    const result = await queryProfileTool(
      { target_org: "TestOrg", profile_name: "UnifiedIndividual__dlm" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.profiles).toEqual([]);
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/profile/UnifiedIndividual__dlm"),
      "dc-token"
    );
  });

  it("includes filter parameter when provided", async () => {
    const mockAuth = {
      getDataCloudCredentials: vi.fn().mockResolvedValue({
        accessToken: "dc-token",
        instanceUrl: "https://test-org.dc.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ profiles: [] })
    };

    await queryProfileTool(
      { target_org: "TestOrg", profile_name: "UnifiedIndividual__dlm", filter: "Id='123'" },
      mockAuth as any,
      mockHttp as any
    );

    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("filter="),
      "dc-token"
    );
  });
});
