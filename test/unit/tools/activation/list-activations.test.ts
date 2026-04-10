import { describe, it, expect, vi } from "vitest";
import { listActivationsTool } from "../../../../src/tools/activation/list-activations.js";

describe("listActivationsTool", () => {
  it("returns list of activations", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: [] })
    };

    const result = await listActivationsTool({ target_org: "TestOrg" }, mockAuth as any, mockHttp as any);

    expect(result).toEqual([]);
  });
});
