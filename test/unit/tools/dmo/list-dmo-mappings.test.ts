import { describe, it, expect, vi } from "vitest";
import { listDmoMappingsTool } from "../../../../src/tools/dmo/list-dmo-mappings.js";
import fixture from "../../../fixtures/dmo-mapping-list.json";

describe("listDmoMappingsTool", () => {
  it("returns mapping between DLO and DMO", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue(fixture)
    };

    const result = await listDmoMappingsTool(
      {
        target_org: "TestOrg",
        dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
        dmo_name: "PRA_BillingAccount__dlm"
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.sourceDlo).toBe("Billing_Account_c_00Dxx0000000001__dll");
    expect(result.targetDmo).toBe("PRA_BillingAccount__dlm");
    expect(result.mappings).toHaveLength(16);
    expect(mockHttp.get).toHaveBeenCalledWith(expect.stringContaining("dloDeveloperName="), "token");
  });
});
