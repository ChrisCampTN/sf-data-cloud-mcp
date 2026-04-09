import { describe, it, expect, vi } from "vitest";
import { listDmosTool } from "../../../../src/tools/dmo/list-dmos.js";
import fixture from "../../../fixtures/dmo-list.json";

describe("listDmosTool", () => {
  it("returns list of DMOs", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com",
        username: "chris@hfaloan.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ dataModelObjects: fixture })
    };

    const result = await listDmosTool(
      { target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("ssot__Account__dlm");
    expect(result[0].category).toBe("PROFILE");
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-objects"),
      "token"
    );
  });

  it("handles error gracefully", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com",
        username: "chris@hfaloan.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockRejectedValue(new Error("Network error"))
    };

    await expect(
      listDmosTool({ target_org: "HFA-Production" }, mockAuth as any, mockHttp as any)
    ).rejects.toThrow("Network error");
  });
});
