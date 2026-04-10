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
    const dloName = await resolver.resolveDloName("Billing_Account__c", "token", "https://instance.com");

    expect(dloName).toBe("Billing_Account_c_00Dxx0000000001__dll");
  });

  it("resolves DLO field to DMO field via mapping", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValueOnce({ dataStreams: dataStreamFixture }).mockResolvedValueOnce(dmoMappingFixture)
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Adjusted_Credit_Score__c",
      "token",
      "https://instance.com"
    );

    expect(mapping.dlo).toBe("Billing_Account_c_00Dxx0000000001__dll");
    expect(mapping.dloField).toBe("Adjusted_Credit_Score_c__c");
    expect(mapping.dmo).toBe("PRA_BillingAccount__dlm");
    expect(mapping.dmoField).toBe("Adjusted_Credit_Score_c_c__c");
  });

  it("falls back to stream describe when simple transform misses", async () => {
    // Simulate: CRM field Remaining_Balance__c → simple transform gives Remaining_Balance_c__c
    // But actual DLO field is Remaining_Balance_formula_c__c (renamed formula field)
    const mappingWithRenamedField = {
      ...dmoMappingFixture,
      mappings: [
        ...dmoMappingFixture.mappings,
        { sourceField: "Remaining_Balance_formula_c__c", targetField: "RemainingBalance_c__c" }
      ]
    };

    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture }) // resolveDloName
        .mockResolvedValueOnce(mappingWithRenamedField) // mapping lookup
        .mockResolvedValueOnce({
          // stream describe fallback
          sourceFields: [{ name: "Remaining_Balance_formula_c", developerName: "Remaining_Balance_formula_c" }]
        })
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Remaining_Balance__c",
      "token",
      "https://instance.com"
    );

    expect(mapping.dloField).toBe("Remaining_Balance_formula_c__c");
    expect(mapping.dmoField).toBe("RemainingBalance_c__c");
    expect(mockHttp.get).toHaveBeenCalledTimes(3); // DLO name + mapping + stream describe
  });

  it("returns simple transform when stream describe fallback also misses", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce({ ...dmoMappingFixture, mappings: [] }) // no mappings at all
        .mockResolvedValueOnce({ sourceFields: [] }) // stream has no matching field
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "NonExistent__c",
      "token",
      "https://instance.com"
    );

    // Falls through gracefully — uses simple transform, dmoField is undefined
    expect(mapping.dloField).toBe("NonExistent_c__c");
    expect(mapping.dmoField).toBeUndefined();
  });

  it("returns simple transform when stream describe throws", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce({ ...dmoMappingFixture, mappings: [] })
        .mockRejectedValueOnce(new Error("404 Not Found")) // stream describe fails
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "NonExistent__c",
      "token",
      "https://instance.com"
    );

    expect(mapping.dloField).toBe("NonExistent_c__c");
    expect(mapping.dmoField).toBeUndefined();
  });
});
