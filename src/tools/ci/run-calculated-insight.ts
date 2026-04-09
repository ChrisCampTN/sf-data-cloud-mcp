import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const runCalculatedInsightInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  ci_name: z.string().describe("Calculated Insight API name"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type RunCalculatedInsightInput = z.infer<typeof runCalculatedInsightInputSchema>;

export async function runCalculatedInsightTool(
  input: RunCalculatedInsightInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, ci_name: input.ci_name, message: "Set confirm: true to run this CI." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights/${input.ci_name}/actions/run`,
    orgCreds.accessToken,
    undefined
  );
}
