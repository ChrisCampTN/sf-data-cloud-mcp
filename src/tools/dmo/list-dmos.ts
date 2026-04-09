import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const listDmosInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export type ListDmosInput = z.infer<typeof listDmosInputSchema>;

export interface DmoSummary {
  name: string;
  label: string;
  category: string;
  fields: number;
  isSegmentable: boolean;
  dataSpace: string;
}

export async function listDmosTool(
  input: ListDmosInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<Record<string, unknown>[]> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  // DMO API returns max 50 per page with no pagination signals (no totalSize,
  // no batchSize, no nextPageUrl). Pass hintBatchSize so offset fallback works.
  const result = await http.paginatedGet(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/data-model-objects`,
    orgCreds.accessToken,
    "dataModelObjects",
    orgCreds.instanceUrl,
    50
  );
  return result.items;
}
