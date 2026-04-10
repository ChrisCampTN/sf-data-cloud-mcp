export type TypeMapperContext = "ci" | "mapping";

const CI_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "DateTime",                  // CI quirk: Date -> DateTime to avoid type mismatch
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

const MAPPING_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "Date",                      // Mapping: keep as Date — must match DLO exactly
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

export function correctDmoFieldType(dloType: string, context: TypeMapperContext = "ci"): string {
  const map = context === "mapping" ? MAPPING_TYPE_MAP : CI_TYPE_MAP;
  return map[dloType] ?? "Text";
}

export function cleanDmoFieldName(dloFieldName: string): string {
  // Pattern: custom object fields from CRM get _c__c in DLO, then DMO auto-adds another _c__c
  // e.g., Provider__c (CRM) → Provider_c__c (DLO) → Provider_c_c__c (DMO)
  // We want: Provider_c__c (DLO) → Provider__c (DMO) — strip the intermediate _c
  //
  // Rule: if a field name ends with _c_c__c, collapse to _c__c
  // But also handle: if DLO field ends with _c__c (single custom suffix), the DMO should strip to __c
  if (dloFieldName.match(/_c_c__c$/)) {
    return dloFieldName.replace(/_c_c__c$/, "_c__c");
  }
  if (
    dloFieldName.match(/[a-z]_c__c$/) &&
    !dloFieldName.startsWith("DataSource") &&
    !dloFieldName.startsWith("KQ_")
  ) {
    return dloFieldName.replace(/_c__c$/, "__c");
  }
  return dloFieldName;
}
