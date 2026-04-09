import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listDataActionsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export async function listDataActionsTool(
  input: z.infer<typeof listDataActionsInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const response = await http.get<{ dataActions: Record<string, unknown>[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-actions`,
    orgCreds.accessToken
  );
  return response.dataActions;
}
