import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

const SCHEDULE_MAP: Record<string, string> = {
  daily: "TwentyFour",
  "24h": "TwentyFour",
  "12h": "Twelve",
  "6h": "Six",
  "1h": "One",
  none: "NotScheduled",
  off: "NotScheduled",
  TwentyFour: "TwentyFour",
  Twelve: "Twelve",
  Six: "Six",
  One: "One",
  NotScheduled: "NotScheduled"
};

export const createCalculatedInsightInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  definition: z.record(z.string(), z.unknown()).describe("CI definition object"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type CreateCalculatedInsightInput = z.infer<typeof createCalculatedInsightInputSchema>;

function enhanceDefinition(definition: Record<string, unknown>): Record<string, unknown> {
  const enhanced = { ...definition };

  // Auto-add definitionType
  if (!enhanced.definitionType) {
    enhanced.definitionType = "CALCULATED_METRIC";
  }

  // Translate schedule interval
  if (typeof enhanced.publishScheduleInterval === "string") {
    const mapped = SCHEDULE_MAP[enhanced.publishScheduleInterval];
    if (mapped) {
      enhanced.publishScheduleInterval = mapped;
    }
  }

  return enhanced;
}

export async function createCalculatedInsightTool(
  input: CreateCalculatedInsightInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const enhanced = enhanceDefinition(input.definition);

  if (!input.confirm) {
    return { preview: true, definition: enhanced, message: "Set confirm: true to create this CI." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights`,
    orgCreds.accessToken,
    enhanced
  );
}
