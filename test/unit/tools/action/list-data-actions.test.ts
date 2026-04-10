import { describe, it, expect, vi } from "vitest";
import { listDataActionsTool } from "../../../../src/tools/action/list-data-actions.js";

describe("listDataActionsTool", () => {
  it("returns list of data actions", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: [] })
    };

    const result = await listDataActionsTool({ target_org: "TestOrg" }, mockAuth as any, mockHttp as any);

    expect(result).toEqual([]);
  });
});
