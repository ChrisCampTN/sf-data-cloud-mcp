import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const publishSegmentInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  segment_name: z.string().describe("Segment API name"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export async function publishSegmentTool(
  input: z.infer<typeof publishSegmentInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, segment_name: input.segment_name, message: "Set confirm: true to publish this segment." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/segments/${input.segment_name}/actions/publish`,
    orgCreds.accessToken,
    undefined
  );
}
