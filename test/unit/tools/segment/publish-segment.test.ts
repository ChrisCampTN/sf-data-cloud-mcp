import { describe, it, expect, vi } from "vitest";
import { publishSegmentTool } from "../../../../src/tools/segment/publish-segment.js";

describe("publishSegmentTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const result = await publishSegmentTool(
      { target_org: "TestOrg", segment_name: "Test", confirm: false },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.preview).toBe(true);
  });

  it("publishes segment when confirm is true", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ status: "PUBLISHING" }) };
    const result = await publishSegmentTool(
      { target_org: "TestOrg", segment_name: "Test", confirm: true },
      mockAuth as any,
      mockHttp as any
    );
    expect(result.status).toBe("PUBLISHING");
  });
});
