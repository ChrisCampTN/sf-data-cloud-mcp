import type { DataCloudHttpClient } from "../util/http.js";

export interface FieldMapping {
  crm: string;
  crmField?: string;
  dlo: string;
  dloField?: string;
  dmo: string;
  dmoField?: string;
}

export class FieldResolver {
  private dloCache = new Map<string, string>();
  private dloColumnsCache = new Map<string, string[]>();
  private http: DataCloudHttpClient;

  constructor(http: DataCloudHttpClient) {
    this.http = http;
  }

  async resolveDloName(
    crmObjectName: string,
    token: string,
    instanceUrl: string
  ): Promise<string> {
    const cached = this.dloCache.get(crmObjectName);
    if (cached) return cached;

    const response = await this.http.get<{
      dataStreams: Array<{ name: string; label: string }>;
    }>(`${instanceUrl}/services/data/v66.0/ssot/data-streams`, token);

    const crmBase = crmObjectName.replace(/__c$/, "_c").replace(/__/, "_");
    const stream = response.dataStreams.find(
      (s) => s.name.startsWith(crmBase) || s.label.includes(crmObjectName)
    );

    if (!stream) {
      throw new Error(`No data stream found for CRM object: ${crmObjectName}`);
    }

    const dloName = `${stream.name}__dll`;
    this.dloCache.set(crmObjectName, dloName);
    return dloName;
  }

  async resolveFieldMapping(
    crmObjectName: string,
    crmFieldName: string,
    token: string,
    instanceUrl: string
  ): Promise<FieldMapping> {
    const dloName = await this.resolveDloName(
      crmObjectName,
      token,
      instanceUrl
    );

    // Static guess: CRM field Adjusted_Credit_Score__c -> DLO field Adjusted_Credit_Score_c__c
    const guessedDloField = crmFieldName.replace(/__c$/, "_c__c");

    // Validate guess against actual DLO columns
    const dloField = await this.validateDloField(
      dloName,
      crmFieldName,
      guessedDloField,
      token,
      instanceUrl
    );

    // Get DMO mapping for this DLO
    const mapping = await this.http.get<{
      sourceDlo: string;
      targetDmo: string;
      mappings: Array<{ sourceField: string; targetField: string }>;
    }>(
      `${instanceUrl}/services/data/v66.0/ssot/data-model-object-mappings?dloDeveloperName=${dloName}`,
      token
    );

    const fieldMapping = mapping.mappings.find(
      (m) => m.sourceField === dloField
    );

    return {
      crm: crmObjectName,
      crmField: crmFieldName,
      dlo: dloName,
      dloField,
      dmo: mapping.targetDmo,
      dmoField: fieldMapping?.targetField
    };
  }

  private async validateDloField(
    dloName: string,
    crmFieldName: string,
    guessedDloField: string,
    token: string,
    instanceUrl: string
  ): Promise<string> {
    const columns = await this.getDloColumns(dloName, token, instanceUrl);
    if (!columns) return guessedDloField;

    // Exact match — guess was correct
    if (columns.includes(guessedDloField)) return guessedDloField;

    // Fuzzy match: find a column containing the CRM field's base name
    const baseName = crmFieldName
      .replace(/__c$/, "")
      .replace(/_/g, "")
      .toLowerCase();

    const match = columns.find((col) => {
      const colNormalized = col
        .replace(/__c$/, "")
        .replace(/_/g, "")
        .toLowerCase();
      return colNormalized.includes(baseName);
    });

    return match ?? guessedDloField;
  }

  private async getDloColumns(
    dloName: string,
    token: string,
    instanceUrl: string
  ): Promise<string[] | null> {
    const cached = this.dloColumnsCache.get(dloName);
    if (cached) return cached;

    try {
      const result = await this.http.post<{
        metadata: { columns: Array<{ name: string }> };
      }>(
        `${instanceUrl}/services/data/v66.0/ssot/query`,
        token,
        { sql: `SELECT * FROM ${dloName} LIMIT 0` }
      );

      const columns = result.metadata.columns.map((c) => c.name);
      this.dloColumnsCache.set(dloName, columns);
      return columns;
    } catch {
      return null;
    }
  }
}
