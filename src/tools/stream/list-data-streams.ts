import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listDataStreamsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export async function listDataStreamsTool(
  input: z.infer<typeof listDataStreamsInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const response = await http.get<{ dataStreams: Record<string, unknown>[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-streams`,
    orgCreds.accessToken
  );
  return response.dataStreams;
}
