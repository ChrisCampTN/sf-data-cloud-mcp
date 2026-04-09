import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const describeDmoInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  dmo_name: z.string().describe("DMO API name (e.g. PRA_BillingAccount__dlm)")
});

export type DescribeDmoInput = z.infer<typeof describeDmoInputSchema>;

export interface DmoField {
  name: string;
  type: string;
  label: string;
  creationType: string;
}

export interface DmoDescription {
  name: string;
  category: string;
  creationType: string;
  dataSpaceName: string;
  fields: DmoField[];
}

export async function describeDmoTool(
  input: DescribeDmoInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<DmoDescription> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.get<DmoDescription>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects/${input.dmo_name}`,
    orgCreds.accessToken
  );
}
