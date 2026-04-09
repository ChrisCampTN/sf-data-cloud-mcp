import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const describeDataStreamInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  stream_name: z.string().describe("Data stream name")
});

export async function describeDataStreamTool(
  input: z.infer<typeof describeDataStreamInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-streams/${input.stream_name}`,
    orgCreds.accessToken
  );
}
