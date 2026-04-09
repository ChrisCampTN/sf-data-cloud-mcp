import { describe, it, expect, vi } from "vitest";
import { describeDmoTool } from "../../../../src/tools/dmo/describe-dmo.js";
import fixture from "../../../fixtures/dmo-describe-billing-account.json";

describe("describeDmoTool", () => {
  it("returns DMO description with fields", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com",
        username: "chris@hfaloan.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue(fixture)
    };

    const result = await describeDmoTool(
      { target_org: "HFA-Production", dmo_name: "PRA_BillingAccount__dlm" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.name).toBe("PRA_BillingAccount__dlm");
    expect(result.fields).toHaveLength(15);
    expect(result.fields[0].name).toBe("Adjusted_Credit_Score_c_c__c");
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-objects/PRA_BillingAccount__dlm"),
      "token"
    );
  });
});
