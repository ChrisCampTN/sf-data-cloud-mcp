import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const createDmoInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  definition: z.record(z.string(), z.unknown()).describe("DMO definition object"),
  confirm: z.boolean().optional().describe("Set to true to execute the creation. Omit for preview.")
});

export type CreateDmoInput = z.infer<typeof createDmoInputSchema>;

/**
 * Transform a definition from describe/read schema to create/POST schema.
 * The Data Cloud API uses different field names for GET vs POST:
 *   - "type" → "dataType"
 *   - "name" with __dlm suffix → strip suffix (API appends it)
 *   - "keyQualifierName" → remove (not accepted on create)
 */
export function transformForCreate(definition: Record<string, unknown>): Record<string, unknown> {
  const result = { ...definition };

  // Strip __dlm suffix from object name — API appends it
  if (typeof result.name === "string" && result.name.endsWith("__dlm")) {
    result.name = result.name.replace(/__dlm$/, "");
  }

  // Transform fields array
  if (Array.isArray(result.fields)) {
    result.fields = (result.fields as Record<string, unknown>[]).map(field => {
      const f = { ...field };
      // Rename "type" -> "dataType"
      if ("type" in f && !("dataType" in f)) {
        f.dataType = f.type;
        delete f.type;
      }
      // Remove unsupported fields
      delete f.keyQualifierName;
      delete f.creationType;
      // Strip __c suffix from field names — API auto-appends it
      if (typeof f.name === "string" && f.name.endsWith("__c")) {
        f.name = f.name.replace(/__c$/, "");
      }
      // Ensure isPrimaryKey is explicitly set
      if (f.isPrimaryKey !== true) {
        f.isPrimaryKey = false;
      }
      return f;
    });
  }

  return result;
}

export async function createDmoTool(
  input: CreateDmoInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const transformed = transformForCreate(input.definition);

  if (!input.confirm) {
    return { preview: true, definition: transformed, message: "Set confirm: true to create this DMO." };
  }

  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects`,
    orgCreds.accessToken,
    transformed
  );
}
