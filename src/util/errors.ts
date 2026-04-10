interface ErrorPattern {
  pattern: RegExp;
  translate: (match: RegExpMatchArray, original: string) => string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /Invalid.*Calculated Insight Publish Schedule Interval:\s*(\S+)/i,
    translate: (match, original) =>
      `Schedule interval must be PascalCase: NotScheduled, One (1hr), Six (6hr), Twelve (12hr), TwentyFour (24hr). You sent: ${match[1]}`
  },
  {
    pattern: /Error getting FactTable\s+\S+__dll/i,
    translate: () =>
      `CIs require DMO references (__dlm), not DLO references (__dll). Use resolve_field_names to find DMO table names.`
  },
  {
    pattern: /cannot be found in dependencies or existing DMOs/i,
    translate: () =>
      `Field not found on DMO. Run describe_dmo to check actual field names — custom object fields get _c_c__c suffix.`
  },
  {
    pattern: /type Date is different from.*type DateTime/i,
    translate: () =>
      `DLO/DMO type mismatch on Date/Currency fields. Use create_dmo_from_dlo which auto-corrects types, or exclude the field and add manually.`
  },
  {
    pattern: /Unable to find Primary Key of DLO/i,
    translate: () => `Reference table DLOs require a Key field in the mapping. Include Key__c in your field list.`
  },
  {
    pattern: /The Definition Type is not supported/i,
    translate: () => `Missing definitionType field. Add "definitionType": "CALCULATED_METRIC" to your CI definition.`
  },
  {
    pattern: /Missing required field\(s\):\s*(.+)/i,
    translate: (match) => `Missing required field(s): ${match[1]}. Check the design doc Section 8 for expected formats.`
  }
];

export function translateError(message: string): string {
  for (const { pattern, translate } of ERROR_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return translate(match, message);
    }
  }
  return message;
}
