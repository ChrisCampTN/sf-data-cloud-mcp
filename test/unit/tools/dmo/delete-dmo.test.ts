import { describe, it, expect, vi } from "vitest";
import { deleteDmoTool } from "../../../../src/tools/dmo/delete-dmo.js";

describe("deleteDmoTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { delete: vi.fn() };

    const result = await deleteDmoTool(
      { target_org: "TestOrg", dmo_name: "Test__dlm", confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.dmo_name).toBe("Test__dlm");
    expect(mockHttp.delete).not.toHaveBeenCalled();
  });

  it("deletes DMO when confirm is true", async () => {
    const mockHttp = {
      delete: vi.fn().mockResolvedValue({})
    };

    const result = await deleteDmoTool(
      { target_org: "TestOrg", dmo_name: "Test__dlm", confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.deleted).toBe(true);
    expect(mockHttp.delete).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-objects/Test__dlm"),
      "token"
    );
  });
});
