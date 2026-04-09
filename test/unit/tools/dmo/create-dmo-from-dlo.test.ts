import { describe, it, expect, vi } from "vitest";
import { createDmoFromDloTool } from "../../../../src/tools/dmo/create-dmo-from-dlo.js";
import dloFixture from "../../../fixtures/dlo-describe-billing-account.json";

describe("createDmoFromDloTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    }),
    getDataCloudCredentials: vi.fn().mockResolvedValue({
      accessToken: "dc-token",
      instanceUrl: "https://test-org.dc.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ metadata: dloFixture }),
      post: vi.fn()
    };

    const result = await createDmoFromDloTool(
      {
        target_org: "TestOrg",
        dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
        dmo_name: "PRA_BillingAccount__dlm",
        confirm: false
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.dmo_definition).toBeDefined();
    expect(result.mapping_definition).toBeDefined();
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("creates DMO and mapping when confirm is true", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ metadata: dloFixture }),
      post: vi.fn().mockResolvedValue({ success: true })
    };

    const result = await createDmoFromDloTool(
      {
        target_org: "TestOrg",
        dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
        dmo_name: "PRA_BillingAccount__dlm",
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.created).toBe(true);
    expect(mockHttp.post).toHaveBeenCalledTimes(2); // DMO + mapping
  });

  it("excludes specified fields", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ metadata: dloFixture }),
      post: vi.fn()
    };

    const result = await createDmoFromDloTool(
      {
        target_org: "TestOrg",
        dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
        dmo_name: "PRA_BillingAccount__dlm",
        exclude_fields: ["cdp_sys_record_currency__c"],
        confirm: false
      },
      mockAuth as any,
      mockHttp as any
    );

    const fieldNames = result.dmo_definition.fields.map((f: any) => f.name);
    expect(fieldNames).not.toContain("cdp_sys_record_currency_c__c");
  });
});
