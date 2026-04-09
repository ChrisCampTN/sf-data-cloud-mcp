import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const queryProfileInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  profile_name: z.string().describe("Unified profile name (e.g. UnifiedIndividual__dlm)"),
  filter: z.string().optional().describe("Filter expression for profile query")
});

export async function queryProfileTool(
  input: z.infer<typeof queryProfileInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const dcCreds = await auth.getDataCloudCredentials(input.target_org);
  const url = input.filter
    ? `${dcCreds.instanceUrl}/api/v1/profile/${input.profile_name}?filter=${encodeURIComponent(input.filter)}`
    : `${dcCreds.instanceUrl}/api/v1/profile/${input.profile_name}`;
  return http.get(url, dcCreds.accessToken);
}
