import { describe, it, expect, vi } from "vitest";
import { FieldResolver } from "../../../src/smart/field-resolver.js";
import dataStreamFixture from "../../fixtures/data-stream-list.json";
import dmoMappingFixture from "../../fixtures/dmo-mapping-list.json";

describe("FieldResolver", () => {
  it("resolves CRM object to DLO name", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ dataStreams: dataStreamFixture })
    };

    const resolver = new FieldResolver(mockHttp as any);
    const dloName = await resolver.resolveDloName(
      "Billing_Account__c",
      "token",
      "https://instance.com"
    );

    expect(dloName).toBe("Billing_Account_c_00Df20000018YWM__dll");
  });

  it("resolves DLO field to DMO field via mapping", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture)
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Adjusted_Credit_Score__c",
      "token",
      "https://instance.com"
    );

    expect(mapping.dlo).toBe("Billing_Account_c_00Df20000018YWM__dll");
    expect(mapping.dloField).toBe("Adjusted_Credit_Score_c__c");
    expect(mapping.dmo).toBe("PRA_BillingAccount__dlm");
    expect(mapping.dmoField).toBe("Adjusted_Credit_Score_c_c__c");
  });
});
