import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const describeTableInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  table: z.string().describe("Table name (DLO __dll or DMO __dlm)")
});

export type DescribeTableInput = z.infer<typeof describeTableInputSchema>;

export async function describeTableTool(
  input: DescribeTableInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/query`,
    orgCreds.accessToken,
    { sql: `SELECT * FROM ${input.table} LIMIT 0` }
  );
}
