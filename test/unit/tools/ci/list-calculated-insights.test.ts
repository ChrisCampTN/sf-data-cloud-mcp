import { describe, it, expect, vi } from "vitest";
import { listCalculatedInsightsTool } from "../../../../src/tools/ci/list-calculated-insights.js";
import fixture from "../../../fixtures/calculated-insight-list.json";
import rawFixture from "../../../fixtures/calculated-insight-list-raw.json";

describe("listCalculatedInsightsTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns simplified CI list", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ calculatedInsights: rawFixture })
    };

    const result = await listCalculatedInsightsTool(
      { target_org: "TestOrg" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(1);
    expect(result[0].apiName).toBe("PRA_Credit_Tier_Assignment__cio");
    expect(result[0].displayName).toBe("PRA Credit Tier Assignment");
    expect(result[0].calculatedInsightStatus).toBe("ACTIVE");
  });

  it("returns full details when raw is true", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ calculatedInsights: rawFixture })
    };

    const result = await listCalculatedInsightsTool(
      { target_org: "TestOrg", raw: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result[0].expression).toBeDefined();
    expect(result[0].definitionType).toBe("CALCULATED_METRIC");
  });
});
