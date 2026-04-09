import { describe, it, expect, vi } from "vitest";
import { listDmoMappingsTool } from "../../../../src/tools/dmo/list-dmo-mappings.js";
import fixture from "../../../fixtures/dmo-mapping-list.json";

describe("listDmoMappingsTool", () => {
  it("returns mapping between DLO and DMO", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue(fixture)
    };

    const result = await listDmoMappingsTool(
      {
        target_org: "HFA-Production",
        dlo_name: "Billing_Account_c_00Df20000018YWM__dll",
        dmo_name: "PRA_BillingAccount__dlm"
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.sourceDlo).toBe("Billing_Account_c_00Df20000018YWM__dll");
    expect(result.targetDmo).toBe("PRA_BillingAccount__dlm");
    expect(result.mappings).toHaveLength(16);
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("dloDeveloperName="),
      "token"
    );
  });
});
