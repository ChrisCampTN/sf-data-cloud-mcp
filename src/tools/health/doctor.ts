import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const doctorInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export type DoctorInput = z.infer<typeof doctorInputSchema>;

export interface DoctorResult {
  status: "ok" | "error";
  org: string;
  apiVersion: string;
  indexes: number;
  instanceUrl: string;
  dataCloudUrl: string;
  error?: string;
}

export async function doctorTool(
  input: DoctorInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<DoctorResult> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const dcCreds = await auth.getDataCloudCredentials(input.target_org);

  const searchIndexes = await http.get<{ searchIndexes: unknown[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/search-indexes`,
    orgCreds.accessToken
  );

  return {
    status: "ok",
    org: orgCreds.username,
    apiVersion: "66.0",
    indexes: searchIndexes.searchIndexes?.length ?? 0,
    instanceUrl: orgCreds.instanceUrl,
    dataCloudUrl: dcCreds.instanceUrl
  };
}
