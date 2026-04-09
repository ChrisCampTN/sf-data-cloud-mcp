import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const deleteDmoInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  dmo_name: z.string().describe("DMO API name to delete"),
  confirm: z.boolean().optional().describe("Set to true to execute the deletion. Omit for preview.")
});

export type DeleteDmoInput = z.infer<typeof deleteDmoInputSchema>;

export async function deleteDmoTool(
  input: DeleteDmoInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, dmo_name: input.dmo_name, message: "Set confirm: true to delete this DMO." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  await http.delete(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects/${input.dmo_name}`,
    orgCreds.accessToken
  );
  return { deleted: true, dmo_name: input.dmo_name };
}
