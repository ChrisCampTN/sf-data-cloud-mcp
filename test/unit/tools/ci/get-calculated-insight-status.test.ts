import { describe, it, expect, vi } from "vitest";
import { getCalculatedInsightStatusTool } from "../../../../src/tools/ci/get-calculated-insight-status.js";
import rawFixture from "../../../fixtures/calculated-insight-list-raw.json";

describe("getCalculatedInsightStatusTool", () => {
  it("returns status for a specific CI", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ calculatedInsights: rawFixture })
    };

    const result = await getCalculatedInsightStatusTool(
      { target_org: "HFA-Production", ci_name: "PRA_Credit_Tier_Assignment__cio" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.name).toBe("PRA_Credit_Tier_Assignment__cio");
    expect(result.status).toBe("ACTIVE");
    expect(result.lastRunStatus).toBe("SUCCESS");
  });

  it("throws when CI not found", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ calculatedInsights: [] })
    };

    await expect(
      getCalculatedInsightStatusTool(
        { target_org: "HFA-Production", ci_name: "NonExistent__cio" },
        mockAuth as any,
        mockHttp as any
      )
    ).rejects.toThrow("not found");
  });
});
