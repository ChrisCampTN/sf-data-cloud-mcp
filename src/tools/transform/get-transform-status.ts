import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const getTransformStatusInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  transform_name: z.string().describe("Transform name")
});

export async function getTransformStatusTool(
  input: z.infer<typeof getTransformStatusInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-transforms/${input.transform_name}`,
    orgCreds.accessToken
  );
}
