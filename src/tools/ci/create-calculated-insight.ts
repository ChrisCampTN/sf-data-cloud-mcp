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

interface EnhanceResult {
  definition: Record<string, unknown>;
  warnings: string[];
}

function enhanceDefinition(definition: Record<string, unknown>): EnhanceResult {
  const enhanced = { ...definition };
  const warnings: string[] = [];

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

  // Warn if expression references DLO tables (__dll) — CIs require DMO tables (__dlm)
  if (typeof enhanced.expression === "string" && enhanced.expression.includes("__dll")) {
    warnings.push(
      "Expression contains __dll (DLO) table references. CIs require __dlm (DMO) references. " +
        "Use resolve_field_names to find the correct DMO table names, or use the sql_translator smart layer."
    );
  }

  return { definition: enhanced, warnings };
}

export async function createCalculatedInsightTool(
  input: CreateCalculatedInsightInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const { definition: enhanced, warnings } = enhanceDefinition(input.definition);

  if (!input.confirm) {
    const preview: Record<string, unknown> = {
      preview: true,
      definition: enhanced,
      message: "Set confirm: true to create this CI."
    };
    if (warnings.length > 0) preview.warnings = warnings;
    return preview;
  }

  // Block creation if expression has DLO references — they'll fail at runtime
  if (warnings.length > 0 && typeof enhanced.expression === "string" && enhanced.expression.includes("__dll")) {
    return {
      error: "Cannot create CI with __dll references in expression. CIs require __dlm (DMO) table names.",
      warnings
    };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights`,
    orgCreds.accessToken,
    enhanced
  );
}
