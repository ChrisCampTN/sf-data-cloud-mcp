import { describe, it, expect, vi } from "vitest";
import { deleteCalculatedInsightTool } from "../../../../src/tools/ci/delete-calculated-insight.js";

describe("deleteCalculatedInsightTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { delete: vi.fn() };

    const result = await deleteCalculatedInsightTool(
      { target_org: "TestOrg", ci_name: "Test__cio", confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(mockHttp.delete).not.toHaveBeenCalled();
  });

  it("deletes CI when confirm is true", async () => {
    const mockHttp = {
      delete: vi.fn().mockResolvedValue({})
    };

    const result = await deleteCalculatedInsightTool(
      { target_org: "TestOrg", ci_name: "Test__cio", confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.deleted).toBe(true);
    expect(mockHttp.delete).toHaveBeenCalledWith(
      expect.stringContaining("/calculated-insights/Test__cio"),
      "token"
    );
  });
});
