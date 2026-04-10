import { describe, it, expect, vi } from "vitest";
import { searchHybridTool } from "../../../../src/tools/query/search-hybrid.js";

describe("searchHybridTool", () => {
  it("posts hybrid search request", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ results: [] })
    };

    await searchHybridTool(
      { target_org: "TestOrg", index_name: "TestIndex", query: "billing", limit: 5 },
      mockAuth as any,
      mockHttp as any
    );

    expect(mockHttp.post).toHaveBeenCalledWith(expect.stringContaining("/search-indexes/TestIndex/hybrid"), "token", {
      query: "billing",
      limit: 5
    });
  });
});
