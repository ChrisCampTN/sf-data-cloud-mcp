import { describe, it, expect, vi } from "vitest";
import { createActivationTool } from "../../../../src/tools/activation/create-activation.js";

describe("createActivationTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://hfaloan.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const result = await createActivationTool(
      { target_org: "HFA-Production", definition: { name: "Test" }, confirm: false },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.preview).toBe(true);
  });

  it("creates activation when confirm is true", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ success: true }) };
    const result = await createActivationTool(
      { target_org: "HFA-Production", definition: { name: "Test" }, confirm: true },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.success).toBe(true);
  });
});
