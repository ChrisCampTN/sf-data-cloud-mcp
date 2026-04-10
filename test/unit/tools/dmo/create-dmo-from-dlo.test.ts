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

  it("uses mapping context for field types (DATE stays Date)", async () => {
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

    // dloFixture has Default_Processed_Date_c__c with type DATE
    // and First_Successful_Payment_Date_Only_c__c with type DATE
    // In mapping context, DATE should stay "Date" not become "DateTime"
    const fields = (result.dmo_definition as any).fields as any[];
    const dateField = fields.find((f: any) =>
      f.name.includes("Default_Processed_Date")
    );
    expect(dateField.dataType).toBe("Date");
  });

  it("strips __c suffix from DMO field names in create payload", async () => {
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

    const fields = (result.dmo_definition as any).fields as any[];
    // No field name in the create payload should end with __c
    for (const field of fields) {
      expect(field.name).not.toMatch(/__c$/);
    }
  });
});
