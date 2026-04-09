import { describe, it, expect, vi } from "vitest";
import { runTransformTool } from "../../../../src/tools/transform/run-transform.js";

describe("runTransformTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://hfaloan.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const result = await runTransformTool(
      { target_org: "HFA-Production", transform_name: "Test", confirm: false },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.preview).toBe(true);
  });

  it("runs transform when confirm is true", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ status: "RUNNING" }) };
    const result = await runTransformTool(
      { target_org: "HFA-Production", transform_name: "Test", confirm: true },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.status).toBe("RUNNING");
  });
});
