import { describe, it, expect, vi } from "vitest";
import { listIdentityResolutionsTool } from "../../../../src/tools/identity/list-identity-resolutions.js";
import fixture from "../../../fixtures/identity-resolution-list.json";

describe("listIdentityResolutionsTool", () => {
  it("returns list of identity resolutions", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: fixture })
    };

    const result = await listIdentityResolutionsTool(
      { target_org: "TestOrg" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe("MC - Identity Resolution");
  });
});
