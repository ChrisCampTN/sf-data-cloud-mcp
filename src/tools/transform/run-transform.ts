import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const runTransformInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  transform_name: z.string().describe("Transform name"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export async function runTransformTool(
  input: z.infer<typeof runTransformInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  if (!input.confirm) {
    return { preview: true, transform_name: input.transform_name, message: "Set confirm: true to run this transform." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-transforms/${input.transform_name}/actions/run`,
    orgCreds.accessToken,
    undefined
  );
}
