import { describe, it, expect, vi } from "vitest";
import { describeTableTool } from "../../../../src/tools/query/describe-table.js";

describe("describeTableTool", () => {
  it("queries table with LIMIT 0 for metadata", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ data: [], metadata: { columns: [] } })
    };

    await describeTableTool(
      { target_org: "TestOrg", table: "credit_tier_models__dll" },
      mockAuth as any,
      mockHttp as any
    );

    expect(mockHttp.post).toHaveBeenCalledWith(expect.stringContaining("/ssot/query"), "token", {
      sql: "SELECT * FROM credit_tier_models__dll LIMIT 0"
    });
  });
});
