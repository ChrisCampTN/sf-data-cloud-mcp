import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listDmoMappingsInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  dlo_name: z.string().describe("DLO developer name"),
  dmo_name: z.string().describe("DMO developer name")
});

export type ListDmoMappingsInput = z.infer<typeof listDmoMappingsInputSchema>;

export async function listDmoMappingsTool(
  input: ListDmoMappingsInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-object-mappings?dloDeveloperName=${input.dlo_name}&dmoDeveloperName=${input.dmo_name}`,
    orgCreds.accessToken
  );
}
