import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listTransformsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export async function listTransformsTool(
  input: z.infer<typeof listTransformsInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const response = await http.get<{ dataTransforms: Record<string, unknown>[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-transforms`,
    orgCreds.accessToken
  );
  return response.dataTransforms;
}
