import { describe, it, expect, vi } from "vitest";
import { runCalculatedInsightTool } from "../../../../src/tools/ci/run-calculated-insight.js";

describe("runCalculatedInsightTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };

    const result = await runCalculatedInsightTool(
      { target_org: "TestOrg", ci_name: "Test__cio", confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("triggers CI run when confirm is true", async () => {
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ status: "RUNNING" })
    };

    const result = await runCalculatedInsightTool(
      { target_org: "TestOrg", ci_name: "Test__cio", confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.status).toBe("RUNNING");
    expect(mockHttp.post).toHaveBeenCalledWith(
      expect.stringContaining("/calculated-insights/Test__cio/actions/run"),
      "token",
      undefined
    );
  });
});
