import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const createDataStreamInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  definition: z.record(z.string(), z.unknown()).describe("Data stream definition"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export async function createDataStreamTool(
  input: z.infer<typeof createDataStreamInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, definition: input.definition, message: "Set confirm: true to create this data stream." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-streams`,
    orgCreds.accessToken,
    input.definition
  );
}
