import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";
import { resolveScheduleInterval } from "./schedule-map.js";

export const updateCalculatedInsightInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  ci_name: z.string().describe("Calculated Insight API name (e.g. PRA_Flag_Evaluation__cio)"),
  schedule_interval: z
    .enum(["daily", "24h", "12h", "6h", "1h", "TwentyFour", "Twelve", "Six", "One", "none", "off", "NotScheduled"])
    .optional()
    .describe("Schedule interval: daily | 12h | 6h | 1h | off (or PascalCase API values)"),
  schedule_start: z
    .string()
    .optional()
    .describe("ISO datetime for first run (UTC). Required when scheduling; auto-cleared when setting NotScheduled."),
  is_enabled: z.boolean().optional().describe("Pause/resume CI without deletion"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type UpdateCalculatedInsightInput = z.infer<typeof updateCalculatedInsightInputSchema>;

interface BuildResult {
  payload: Record<string, unknown>;
  warnings: string[];
}

function buildPatchPayload(input: UpdateCalculatedInsightInput): BuildResult {
  const payload: Record<string, unknown> = {};
  const warnings: string[] = [];

  if (input.schedule_interval !== undefined) {
    const resolved = resolveScheduleInterval(input.schedule_interval);
    payload.publishScheduleInterval = resolved;

    if (resolved === "NotScheduled") {
      // API rejects startDateTime when interval is NotScheduled
      if (input.schedule_start) {
        warnings.push("schedule_start ignored — API requires no start date when interval is NotScheduled.");
      }
    } else if (input.schedule_start) {
      payload.publishScheduleStartDateTime = input.schedule_start;
    }
  } else if (input.schedule_start) {
    payload.publishScheduleStartDateTime = input.schedule_start;
  }

  if (input.is_enabled !== undefined) {
    payload.isEnabled = input.is_enabled;
  }

  return { payload, warnings };
}

export async function updateCalculatedInsightTool(
  input: UpdateCalculatedInsightInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const { payload, warnings } = buildPatchPayload(input);

  if (!input.confirm) {
    const preview: Record<string, unknown> = {
      preview: true,
      ci_name: input.ci_name,
      payload,
      message: "Set confirm: true to apply this update."
    };
    if (warnings.length > 0) preview.warnings = warnings;
    return preview;
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const result = await http.patch(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights/${input.ci_name}`,
    orgCreds.accessToken,
    payload
  );

  const response: Record<string, unknown> = { ...(result as Record<string, unknown>) };
  if (warnings.length > 0) response.warnings = warnings;
  return response;
}
