import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const describeSegmentInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  segment_name: z.string().describe("Segment API name")
});

export async function describeSegmentTool(
  input: z.infer<typeof describeSegmentInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/segments/${input.segment_name}`,
    orgCreds.accessToken
  );
}
