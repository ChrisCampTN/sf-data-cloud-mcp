import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const deleteCalculatedInsightInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  ci_name: z.string().describe("Calculated Insight API name to delete"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type DeleteCalculatedInsightInput = z.infer<typeof deleteCalculatedInsightInputSchema>;

export async function deleteCalculatedInsightTool(
  input: DeleteCalculatedInsightInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, ci_name: input.ci_name, message: "Set confirm: true to delete this CI." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  await http.delete(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights/${input.ci_name}`,
    orgCreds.accessToken
  );
  return { deleted: true, ci_name: input.ci_name };
}
