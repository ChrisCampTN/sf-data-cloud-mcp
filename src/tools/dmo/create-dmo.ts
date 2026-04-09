import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const createDmoInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  definition: z.record(z.string(), z.unknown()).describe("DMO definition object"),
  confirm: z.boolean().optional().describe("Set to true to execute the creation. Omit for preview.")
});

export type CreateDmoInput = z.infer<typeof createDmoInputSchema>;

export async function createDmoTool(
  input: CreateDmoInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, definition: input.definition, message: "Set confirm: true to create this DMO." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects`,
    orgCreds.accessToken,
    input.definition
  );
}
