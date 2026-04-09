import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";
import { FieldResolver } from "../../smart/field-resolver.js";

export const resolveFieldNamesInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  crm_object: z.string().describe("CRM object API name (e.g. Billing_Account__c)"),
  crm_field: z.string().optional().describe("CRM field API name (e.g. Provider__c)")
});

export async function resolveFieldNamesTool(
  input: z.infer<typeof resolveFieldNamesInputSchema>,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const resolver = new FieldResolver(http);

  if (input.crm_field) {
    const mapping = await resolver.resolveFieldMapping(
      input.crm_object,
      input.crm_field,
      orgCreds.accessToken,
      orgCreds.instanceUrl
    );
    return { ...mapping };
  }

  const dloName = await resolver.resolveDloName(
    input.crm_object,
    orgCreds.accessToken,
    orgCreds.instanceUrl
  );
  return { crm: input.crm_object, dlo: dloName };
}
