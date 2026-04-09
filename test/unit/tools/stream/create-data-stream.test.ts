import { describe, it, expect, vi } from "vitest";
import { createDataStreamTool } from "../../../../src/tools/stream/create-data-stream.js";

describe("createDataStreamTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const result = await createDataStreamTool(
      { target_org: "TestOrg", definition: { name: "Test" }, confirm: false },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.preview).toBe(true);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("creates stream when confirm is true", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ success: true }) };
    const result = await createDataStreamTool(
      { target_org: "TestOrg", definition: { name: "Test" }, confirm: true },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.success).toBe(true);
  });
});
