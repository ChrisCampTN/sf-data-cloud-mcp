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

    expect(dloName).toBe("Billing_Account_c_00Dxx0000000001__dll");
  });

  it("resolves DLO field to DMO field via mapping", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture),
      post: vi.fn().mockResolvedValue({
        metadata: {
          columns: [
            { name: "Adjusted_Credit_Score_c__c" },
            { name: "Status_c__c" }
          ]
        }
      })
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

  it("falls back to actual DLO columns when guess doesn't match", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture),
      post: vi.fn().mockResolvedValue({
        metadata: {
          columns: [
            { name: "Remaining_Balance_formula_c__c" },
            { name: "Name__c" },
            { name: "Id__c" }
          ]
        }
      })
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Remaining_Balance__c",
      "token",
      "https://instance.com"
    );

    // Guess would be "Remaining_Balance_c__c" but actual DLO column is
    // "Remaining_Balance_formula_c__c". Should fuzzy-match on "Remaining_Balance".
    expect(mapping.dloField).toBe("Remaining_Balance_formula_c__c");
  });

  it("uses guessed name when it matches actual DLO columns", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture),
      post: vi.fn().mockResolvedValue({
        metadata: {
          columns: [
            { name: "Status_c__c" },
            { name: "Name__c" }
          ]
        }
      })
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Status__c",
      "token",
      "https://instance.com"
    );

    // Guess "Status_c__c" matches an actual column — use it directly
    expect(mapping.dloField).toBe("Status_c__c");
  });

  it("falls back to guessed name when query fails", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture),
      post: vi.fn().mockRejectedValue(new Error("Network error"))
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Status__c",
      "token",
      "https://instance.com"
    );

    // Query failed — fall back to the string-based guess
    expect(mapping.dloField).toBe("Status_c__c");
  });

  it("caches DLO columns across multiple resolutions", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture)
        .mockResolvedValueOnce(dmoMappingFixture),
      post: vi.fn().mockResolvedValue({
        metadata: {
          columns: [
            { name: "Status_c__c" },
            { name: "Name__c" }
          ]
        }
      })
    };

    const resolver = new FieldResolver(mockHttp as any);

    await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Status__c",
      "token",
      "https://instance.com"
    );
    await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Name",
      "token",
      "https://instance.com"
    );

    // POST (query) should only be called once — second call uses cache
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
  });
});
