import { describe, it, expect, vi } from "vitest";
import { resolveFieldNamesTool } from "../../../../src/tools/smart/resolve-field-names.js";
import dataStreamFixture from "../../../fixtures/data-stream-list.json";
import mappingFixture from "../../../fixtures/dmo-mapping-list.json";

describe("resolveFieldNamesTool", () => {
  it("resolves CRM object to DLO name", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ dataStreams: dataStreamFixture })
    };

    const result = await resolveFieldNamesTool(
      { target_org: "TestOrg", crm_object: "Billing_Account__c" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.crm).toBe("Billing_Account__c");
    expect(result.dlo).toBe("Billing_Account_c_00Dxx0000000001__dll");
  });

  it("resolves CRM field to DMO field", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValueOnce({ dataStreams: dataStreamFixture }).mockResolvedValueOnce(mappingFixture)
    };

    const result = await resolveFieldNamesTool(
      { target_org: "TestOrg", crm_object: "Billing_Account__c", crm_field: "Adjusted_Credit_Score__c" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.dmo).toBe("PRA_BillingAccount__dlm");
    expect(result.dmoField).toBe("Adjusted_Credit_Score_c_c__c");
  });
});
