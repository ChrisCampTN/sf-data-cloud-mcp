import { describe, it, expect, vi } from "vitest";
import { querySqlTool } from "../../../../src/tools/query/query-sql.js";
import fixture from "../../../fixtures/credit-tier-query-results.json";

describe("querySqlTool", () => {
  it("executes SQL query and returns results", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      post: vi.fn().mockResolvedValue(fixture)
    };

    const result = await querySqlTool(
      { target_org: "TestOrg", sql: "SELECT * FROM credit_tier_models__dll" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.data).toHaveLength(4);
    expect(mockHttp.post).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/query"),
      "token",
      { sql: "SELECT * FROM credit_tier_models__dll" }
    );
  });
});
