import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const searchHybridInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username"),
  index_name: z.string().describe("Search index name"),
  query: z.string().describe("Search query text"),
  limit: z.number().optional().default(10).describe("Max results (default 10)")
});

export type SearchHybridInput = z.infer<typeof searchHybridInputSchema>;

export async function searchHybridTool(
  input: SearchHybridInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  return http.post(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/search-indexes/${input.index_name}/hybrid`,
    orgCreds.accessToken,
    { query: input.query, limit: input.limit }
  );
}
