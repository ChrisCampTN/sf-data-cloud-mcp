import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const describeIdentityResolutionInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  resolution_name: z.string().describe("Identity resolution name")
});

export async function describeIdentityResolutionTool(
  input: z.infer<typeof describeIdentityResolutionInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/identity-resolutions/${input.resolution_name}`,
    orgCreds.accessToken
  );
}
