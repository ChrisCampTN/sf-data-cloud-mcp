import { describe, it, expect, vi } from "vitest";
import { estimateFlexCredits } from "../../../../src/tools/credits/estimate-flex-credits.js";

describe("estimateFlexCredits", () => {
  it("estimates credits for PRA daily CI chain", async () => {
    const result = await estimateFlexCredits({
      mode: "estimate",
      ci_count: 15,
      schedule: "daily",
      avg_records_per_ci: 140000
    });

    expect(result.estimated_daily_credits).toBeGreaterThan(0);
    expect(result.estimated_monthly_credits).toBeGreaterThan(0);
    expect(result.breakdown).toHaveLength(1);
    expect((result.breakdown as any)[0].operation).toBe("Calculated Insight refresh");
  });

  it("combines multiple operation types", async () => {
    const result = await estimateFlexCredits({
      mode: "estimate",
      ci_count: 15,
      schedule: "daily",
      avg_records_per_ci: 140000,
      stream_count: 5,
      avg_records_per_stream: 100000
    });

    expect(result.breakdown).toHaveLength(2);
  });

  it("queries live usage when mode is live", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://instance.com"
      })
    };
    const mockHttp = {
      post: vi.fn().mockResolvedValue({
        data: [{ Unit_Consumed: 150.5, Drawdown_Day: "2026-04-08" }],
        metadata: { rowCount: 1 }
      })
    };

    const result = await estimateFlexCredits(
      { mode: "live", target_org: "TestOrg" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.live_usage).toBeDefined();
    expect(mockHttp.post).toHaveBeenCalled();
  });
});
