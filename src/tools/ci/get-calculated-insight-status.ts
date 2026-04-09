import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const getCalculatedInsightStatusInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  ci_name: z.string().describe("Calculated Insight API name")
});

export type GetCalculatedInsightStatusInput = z.infer<typeof getCalculatedInsightStatusInputSchema>;

export async function getCalculatedInsightStatusTool(
  input: GetCalculatedInsightStatusInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const response = await http.get<{ calculatedInsights: Record<string, unknown>[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights`,
    orgCreds.accessToken
  );

  const ci = response.calculatedInsights.find(
    (c) => c.apiName === input.ci_name
  );

  if (!ci) {
    throw new Error(`Calculated Insight "${input.ci_name}" not found`);
  }

  return {
    name: ci.apiName,
    status: ci.calculatedInsightStatus,
    lastRunStatus: ci.lastRunStatus,
    lastRunDateTime: ci.lastRunDateTime,
    lastRunErrorCode: ci.lastRunErrorCode
  };
}
