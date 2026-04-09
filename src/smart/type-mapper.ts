const DLO_TO_DMO_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "Date",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

export function correctDmoFieldType(dloType: string): string {
  return DLO_TO_DMO_TYPE_MAP[dloType] ?? "Text";
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
