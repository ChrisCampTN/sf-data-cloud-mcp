import { describe, it, expect, vi } from "vitest";
import { listDmosTool } from "../../../../src/tools/dmo/list-dmos.js";
import fixture from "../../../fixtures/dmo-list.json";

describe("listDmosTool", () => {
  it("returns list of DMOs", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com",
        username: "admin@test-org.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: fixture, totalSize: fixture.length })
    };

    const result = await listDmosTool(
      { target_org: "TestOrg" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("ssot__Account__dlm");
    expect(result[0].category).toBe("PROFILE");
    expect(mockHttp.paginatedGet).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-objects"),
      "token",
      "dataModelObjects",
      "https://test-org.my.salesforce.com",
      50 // hintBatchSize — DMO API returns max 50 with no pagination signals
    );
  });

  it("handles error gracefully", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com",
        username: "admin@test-org.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockRejectedValue(new Error("Network error"))
    };

    await expect(
      listDmosTool({ target_org: "TestOrg" }, mockAuth as any, mockHttp as any)
    ).rejects.toThrow("Network error");
  });
});
