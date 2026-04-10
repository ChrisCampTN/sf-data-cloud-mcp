import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const querySqlInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  sql: z.string().describe("SQL query to execute against Data Cloud")
});

export type QuerySqlInput = z.infer<typeof querySqlInputSchema>;

export async function querySqlTool(
  input: QuerySqlInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(`${orgCreds.instanceUrl}/services/data/v66.0/ssot/query`, orgCreds.accessToken, { sql: input.sql });
}
