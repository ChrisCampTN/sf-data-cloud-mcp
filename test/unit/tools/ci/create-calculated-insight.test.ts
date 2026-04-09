import { describe, it, expect, vi } from "vitest";
import { createCalculatedInsightTool } from "../../../../src/tools/ci/create-calculated-insight.js";

describe("createCalculatedInsightTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const definition = {
      apiName: "Test__cio",
      expression: "SELECT 1",
      publishScheduleInterval: "daily"
    };

    const result = await createCalculatedInsightTool(
      { target_org: "TestOrg", definition, confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.definition.publishScheduleInterval).toBe("TwentyFour");
    expect(result.definition.definitionType).toBe("CALCULATED_METRIC");
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("translates schedule intervals", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ success: true }) };

    const result = await createCalculatedInsightTool(
      {
        target_org: "TestOrg",
        definition: { apiName: "Test__cio", expression: "SELECT 1", publishScheduleInterval: "6h" },
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const postBody = mockHttp.post.mock.calls[0][2];
    expect(postBody.publishScheduleInterval).toBe("Six");
  });

  it("passes PascalCase intervals through", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ success: true }) };

    await createCalculatedInsightTool(
      {
        target_org: "TestOrg",
        definition: { apiName: "Test__cio", expression: "SELECT 1", publishScheduleInterval: "NotScheduled" },
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const postBody = mockHttp.post.mock.calls[0][2];
    expect(postBody.publishScheduleInterval).toBe("NotScheduled");
  });

  it("auto-adds definitionType if missing", async () => {
    const mockHttp = { post: vi.fn().mockResolvedValue({ success: true }) };

    await createCalculatedInsightTool(
      {
        target_org: "TestOrg",
        definition: { apiName: "Test__cio", expression: "SELECT 1" },
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const postBody = mockHttp.post.mock.calls[0][2];
    expect(postBody.definitionType).toBe("CALCULATED_METRIC");
  });
});
