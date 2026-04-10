import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

const CREDIT_RATES = {
  ci_refresh_per_1k_rows: 0.25,
  query_per_execution: 0.05,
  stream_ingestion_per_1k_records: 0.1,
  identity_resolution_per_1k_profiles: 0.5,
  segment_publish_per_1k_members: 0.1,
  activation_per_1k_records: 0.15
};

const SCHEDULE_MULTIPLIER: Record<string, number> = {
  daily: 1,
  "12h": 2,
  "6h": 4,
  "1h": 24
};

export const estimateFlexCreditsInputSchema = z.object({
  mode: z.enum(["estimate", "live"]).describe("'estimate' for projection, 'live' for actual usage query"),
  target_org: z.string().optional().describe("Required for live mode"),
  ci_count: z.number().optional().describe("Number of CIs"),
  schedule: z.string().optional().describe("CI schedule: daily, 12h, 6h, 1h"),
  avg_records_per_ci: z.number().optional().describe("Average rows per CI"),
  stream_count: z.number().optional().describe("Number of data streams"),
  avg_records_per_stream: z.number().optional().describe("Average records per stream ingestion")
});

export type EstimateFlexCreditsInput = z.infer<typeof estimateFlexCreditsInputSchema>;

interface CreditBreakdown {
  operation: string;
  daily_credits: number;
  details: string;
}

export async function estimateFlexCredits(
  input: EstimateFlexCreditsInput,
  auth?: AuthManager,
  http?: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (input.mode === "live" && auth && http && input.target_org) {
    const orgCreds = await auth.getOrgCredentials(input.target_org);
    const usage = await http.post(`${orgCreds.instanceUrl}/services/data/v66.0/ssot/query`, orgCreds.accessToken, {
      sql: "SELECT Unit_Consumed, Drawdown_Day FROM FlexCreditsUsage__dll ORDER BY Drawdown_Day DESC LIMIT 30"
    });
    return { live_usage: usage };
  }

  const breakdown: CreditBreakdown[] = [];

  if (input.ci_count && input.avg_records_per_ci) {
    const multiplier = SCHEDULE_MULTIPLIER[input.schedule ?? "daily"] ?? 1;
    const dailyCredits =
      input.ci_count * (input.avg_records_per_ci / 1000) * CREDIT_RATES.ci_refresh_per_1k_rows * multiplier;
    breakdown.push({
      operation: "Calculated Insight refresh",
      daily_credits: dailyCredits,
      details: `${input.ci_count} CIs x ${input.avg_records_per_ci} rows x ${multiplier}x/day`
    });
  }

  if (input.stream_count && input.avg_records_per_stream) {
    const dailyCredits =
      input.stream_count * (input.avg_records_per_stream / 1000) * CREDIT_RATES.stream_ingestion_per_1k_records;
    breakdown.push({
      operation: "Data stream ingestion",
      daily_credits: dailyCredits,
      details: `${input.stream_count} streams x ${input.avg_records_per_stream} records`
    });
  }

  const totalDaily = breakdown.reduce((sum, b) => sum + b.daily_credits, 0);

  return {
    estimated_daily_credits: totalDaily,
    estimated_monthly_credits: totalDaily * 30,
    breakdown
  };
}
