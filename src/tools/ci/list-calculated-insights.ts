import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listCalculatedInsightsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  raw: z.boolean().optional().describe("Return full CI definitions including expressions")
});

export type ListCalculatedInsightsInput = z.infer<typeof listCalculatedInsightsInputSchema>;

export async function listCalculatedInsightsTool(
  input: ListCalculatedInsightsInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const response = await http.get<{ calculatedInsights: Record<string, unknown>[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/calculated-insights`,
    orgCreds.accessToken
  );

  if (input.raw) {
    return response.calculatedInsights;
  }

  return response.calculatedInsights.map(ci => ({
    apiName: ci.apiName,
    displayName: ci.displayName,
    calculatedInsightStatus: ci.calculatedInsightStatus
  }));
}
