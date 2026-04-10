import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";
import { correctDmoFieldType } from "../../smart/type-mapper.js";

export const createDmoFromDloInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  dlo_name: z.string().describe("DLO table name (e.g. Billing_Account_c_00Dxx0000000001__dll)"),
  dmo_name: z.string().optional().describe("Target DMO name. Derived from DLO name if omitted."),
  category: z.string().optional().default("OTHER").describe("DMO category (default: OTHER)"),
  include_fields: z.array(z.string()).optional().describe("Only include these DLO fields"),
  exclude_fields: z.array(z.string()).optional().describe("Exclude these DLO fields"),
  confirm: z.boolean().optional().describe("Set to true to execute. Omit for preview.")
});

export type CreateDmoFromDloInput = z.infer<typeof createDmoFromDloInputSchema>;

function dloFieldToDmoField(dloField: { name: string; type: string }): { name: string; type: string } {
  // Custom fields get doubled suffix: Field__c → Field_c__c
  const dmoFieldName = dloField.name.endsWith("__c")
    ? dloField.name.replace(/__c$/, "_c__c")
    : dloField.name;

  return { name: dmoFieldName, type: correctDmoFieldType(dloField.type) };
}

export async function createDmoFromDloTool(
  input: CreateDmoFromDloInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const dcCreds = await auth.getDataCloudCredentials(input.target_org);

  // Describe the DLO via Query API
  const dloDescribe = await http.get<{ metadata: { table: string; columns: Array<{ name: string; type: string }> } }>(
    `${dcCreds.instanceUrl}/api/v1/metadata/${input.dlo_name}`,
    dcCreds.accessToken
  );

  let columns = dloDescribe.metadata.columns;

  // Filter fields
  if (input.include_fields) {
    columns = columns.filter(c => input.include_fields!.includes(c.name));
  }
  if (input.exclude_fields) {
    columns = columns.filter(c => !input.exclude_fields!.includes(c.name));
  }

  const dmoName = input.dmo_name ?? input.dlo_name.replace(/__dll$/, "__dlm");
  const category = input.category ?? "OTHER";

  // Build DMO definition using POST schema (dataType, no __dlm suffix)
  const dmoFields = columns.map(col => {
    const mapped = dloFieldToDmoField(col);
    return {
      name: mapped.name,
      dataType: mapped.type,
      label: col.name.replace(/__c$/g, "").replace(/_/g, " ").trim()
    };
  });

  // Strip __dlm suffix — API appends it
  const createName = dmoName.endsWith("__dlm") ? dmoName.replace(/__dlm$/, "") : dmoName;

  const dmoDefinition = {
    name: createName,
    category,
    dataSpaceName: "default",
    fields: dmoFields
  };

  // Build mapping definition
  const fieldMappings = columns.map(col => ({
    sourceField: col.name,
    targetField: dloFieldToDmoField(col).name
  }));

  const mappingDefinition = {
    sourceDlo: input.dlo_name,
    targetDmo: dmoName,
    fieldMappings
  };

  if (!input.confirm) {
    return {
      preview: true,
      dmo_definition: dmoDefinition,
      mapping_definition: mappingDefinition,
      message: "Set confirm: true to create this DMO and mapping."
    };
  }

  // Create DMO
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  await http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects`,
    orgCreds.accessToken,
    dmoDefinition
  );

  // Create mapping
  await http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-object-mappings`,
    orgCreds.accessToken,
    mappingDefinition
  );

  return {
    created: true,
    dmo_name: dmoName,
    fields_mapped: fieldMappings.length
  };
}
