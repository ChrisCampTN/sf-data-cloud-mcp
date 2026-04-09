import { describe, it, expect, vi } from "vitest";
import { listDataStreamsTool } from "../../../../src/tools/stream/list-data-streams.js";
import fixture from "../../../fixtures/data-stream-list.json";

describe("listDataStreamsTool", () => {
  it("returns list of data streams", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: fixture })
    };

    const result = await listDataStreamsTool(
      { target_org: "TestOrg" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(7);
    expect(result[0].name).toBe("Account_00Dxx0000000001");
  });
});
