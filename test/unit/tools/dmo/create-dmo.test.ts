import { describe, it, expect, vi } from "vitest";
import { createDmoTool } from "../../../../src/tools/dmo/create-dmo.js";

describe("createDmoTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const definition = { name: "Test__dlm", fields: [] };

    const result = await createDmoTool(
      { target_org: "TestOrg", definition, confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.definition).toEqual(definition);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("creates DMO when confirm is true", async () => {
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ name: "Test__dlm", success: true })
    };
    const definition = { name: "Test__dlm", fields: [] };

    const result = await createDmoTool(
      { target_org: "TestOrg", definition, confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBeUndefined();
    expect(result.name).toBe("Test__dlm");
    expect(mockHttp.post).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-objects"),
      "token",
      definition
    );
  });
});
