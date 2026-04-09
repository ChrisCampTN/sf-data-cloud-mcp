import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listIdentityResolutionsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export async function listIdentityResolutionsTool(
  input: z.infer<typeof listIdentityResolutionsInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const result = await http.paginatedGet(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/identity-resolutions`,
    orgCreds.accessToken,
    "identityResolutions",
    orgCreds.instanceUrl
  );
  return result.items;
}
