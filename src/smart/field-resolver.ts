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

    // CRM object Billing_Account__c → DLO name pattern: Billing_Account_c_*__dll
    const crmBase = crmObjectName.replace(/__c$/, "_c").replace(/__/, "_");
    const stream = response.dataStreams.find(
      (s) => s.name.startsWith(crmBase) || s.label.includes(crmObjectName)
    );

    if (!stream) {
      throw new Error(`No data stream found for CRM object: ${crmObjectName}`);
    }

    // DLO name = stream name + __dll suffix
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

    // CRM field Adjusted_Credit_Score__c → DLO field Adjusted_Credit_Score_c__c
    const dloField = crmFieldName.replace(/__c$/, "_c__c");

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
}
