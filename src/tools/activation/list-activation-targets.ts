import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listActivationTargetsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export async function listActivationTargetsTool(
  input: z.infer<typeof listActivationTargetsInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const result = await http.paginatedGet(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/activation-targets`,
    orgCreds.accessToken,
    "activationTargets",
    orgCreds.instanceUrl
  );
  return result.items;
}
