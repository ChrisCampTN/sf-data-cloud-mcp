import { describe, it, expect, vi } from "vitest";
import { updateCalculatedInsightTool } from "../../../../src/tools/ci/update-calculated-insight.js";

describe("updateCalculatedInsightTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns preview when confirm is omitted", async () => {
    const mockHttp = { patch: vi.fn() };

    const result = await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "daily",
        schedule_start: "2026-04-14T09:00:00.000Z"
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.payload.publishScheduleInterval).toBe("TwentyFour");
    expect(result.payload.publishScheduleStartDateTime).toBe("2026-04-14T09:00:00.000Z");
    expect(mockHttp.patch).not.toHaveBeenCalled();
  });

  it("translates friendly schedule interval to PascalCase", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ success: true }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "6h",
        schedule_start: "2026-04-14T09:00:00.000Z",
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const patchBody = mockHttp.patch.mock.calls[0][2];
    expect(patchBody.publishScheduleInterval).toBe("Six");
  });

  it("passes PascalCase interval through unchanged", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ success: true }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "TwentyFour",
        schedule_start: "2026-04-14T09:00:00.000Z",
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const patchBody = mockHttp.patch.mock.calls[0][2];
    expect(patchBody.publishScheduleInterval).toBe("TwentyFour");
  });

  it("auto-clears schedule_start when interval is NotScheduled", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ success: true }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "off",
        schedule_start: "2026-04-14T09:00:00.000Z",
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const patchBody = mockHttp.patch.mock.calls[0][2];
    expect(patchBody.publishScheduleInterval).toBe("NotScheduled");
    expect(patchBody).not.toHaveProperty("publishScheduleStartDateTime");
  });

  it("sends is_enabled as isEnabled in the PATCH payload", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ success: true }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        is_enabled: false,
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const patchBody = mockHttp.patch.mock.calls[0][2];
    expect(patchBody.isEnabled).toBe(false);
    expect(patchBody).not.toHaveProperty("publishScheduleInterval");
  });

  it("PATCHes the correct endpoint", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ status: "ok" }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "daily",
        schedule_start: "2026-04-14T09:00:00.000Z",
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(mockHttp.patch).toHaveBeenCalledWith(
      "https://test-org.my.salesforce.com/services/data/v66.0/ssot/calculated-insights/PRA_Test__cio",
      "token",
      expect.any(Object)
    );
  });

  it("combines schedule and is_enabled in one update", async () => {
    const mockHttp = { patch: vi.fn().mockResolvedValue({ success: true }) };

    await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "12h",
        schedule_start: "2026-04-14T06:00:00.000Z",
        is_enabled: true,
        confirm: true
      },
      mockAuth as any,
      mockHttp as any
    );

    const patchBody = mockHttp.patch.mock.calls[0][2];
    expect(patchBody.publishScheduleInterval).toBe("Twelve");
    expect(patchBody.publishScheduleStartDateTime).toBe("2026-04-14T06:00:00.000Z");
    expect(patchBody.isEnabled).toBe(true);
  });

  it("preview shows warning when NotScheduled with schedule_start", async () => {
    const mockHttp = { patch: vi.fn() };

    const result = await updateCalculatedInsightTool(
      {
        target_org: "TestOrg",
        ci_name: "PRA_Test__cio",
        schedule_interval: "none",
        schedule_start: "2026-04-14T09:00:00.000Z"
      },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(result.payload).not.toHaveProperty("publishScheduleStartDateTime");
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining("schedule_start ignored")]));
  });
});
