import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const createDmoMappingInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  mapping: z
    .record(z.string(), z.unknown())
    .describe("Mapping definition with sourceDlo, targetDmo, and fieldMappings"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type CreateDmoMappingInput = z.infer<typeof createDmoMappingInputSchema>;

export async function createDmoMappingTool(
  input: CreateDmoMappingInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, mapping: input.mapping, message: "Set confirm: true to create this mapping." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-object-mappings`,
    orgCreds.accessToken,
    input.mapping
  );
}
