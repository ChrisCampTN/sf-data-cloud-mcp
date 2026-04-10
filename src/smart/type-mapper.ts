export type TypeContext = "mapping" | "ci_sql";

/**
 * DLO → DMO type maps by context.
 *
 * "mapping" context: types must match DLO exactly for field mappings to succeed.
 * "ci_sql" context: types are coerced for CI SQL expressions (Date→DateTime, Currency→Number).
 */
const DLO_TO_DMO_MAPPING: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Boolean",
  DATE: "Date", // Must match DLO exactly for mappings
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number",
  CURRENCY: "Currency" // Must stay Currency for mappings
};

const DLO_TO_DMO_CI_SQL: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "DateTime", // CI SQL requires DateTime, not Date
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number",
  CURRENCY: "Number" // CI SQL treats Currency as Number
};

/**
 * Convert a DLO column type to the correct DMO field type.
 * @param dloType - The DLO column type (e.g. VARCHAR, DECIMAL, DATE)
 * @param context - "mapping" for DMO field mappings, "ci_sql" for CI SQL expressions
 */
export function correctDmoFieldType(dloType: string, context: TypeContext = "ci_sql"): string {
  const map = context === "mapping" ? DLO_TO_DMO_MAPPING : DLO_TO_DMO_CI_SQL;
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
  if (dloFieldName.match(/[a-z]_c__c$/) && !dloFieldName.startsWith("DataSource") && !dloFieldName.startsWith("KQ_")) {
    return dloFieldName.replace(/_c__c$/, "__c");
  }
  return dloFieldName;
}
