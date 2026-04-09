/**
 * Translates SQL from DLO table/field references to DMO references.
 * String-based translator — handles the structured SQL patterns Data Cloud uses.
 */

export function translateDloSqlToDmoSql(
  sql: string,
  tableMap: Record<string, string>,
  fieldMap: Record<string, string>
): string {
  let result = sql;

  // Build alias map: detect "FROM/JOIN table alias" patterns
  const aliasMap = new Map<string, string>();
  const aliasPattern = /(?:FROM|JOIN)\s+(\S+)\s+(?:AS\s+)?([A-Za-z_]\w*)(?=\s|$|,|\))/gi;
  let match;
  while ((match = aliasPattern.exec(sql)) !== null) {
    const tableName = match[1];
    const alias = match[2];
    // Only map if tableName is a known DLO and alias is not a SQL keyword
    if (tableMap[tableName] && !isKeyword(alias)) {
      aliasMap.set(alias, tableName);
    }
  }

  // Replace qualified field references: alias.field → dmo.dmoField
  for (const [alias, dloTable] of aliasMap.entries()) {
    const dmoTable = tableMap[dloTable];
    const fieldPattern = new RegExp(`\\b${escapeRegExp(alias)}\\.([A-Za-z_]\\w*)`, "g");
    result = result.replace(fieldPattern, (_match, fieldName) => {
      const qualifiedDlo = `${dloTable}.${fieldName}`;
      if (fieldMap[qualifiedDlo]) {
        return fieldMap[qualifiedDlo];
      }
      return `${dmoTable}.${fieldName}`;
    });
  }

  // Replace qualified field references: dloTable.field → dmo.dmoField
  for (const [qualifiedDlo, qualifiedDmo] of Object.entries(fieldMap)) {
    result = result.replaceAll(qualifiedDlo, qualifiedDmo);
  }

  // Replace table names (including alias declarations)
  for (const [dloTable, dmoTable] of Object.entries(tableMap)) {
    // Remove alias declarations by replacing "dloTable alias" with just "dmoTable"
    for (const [alias, mappedDlo] of aliasMap.entries()) {
      if (mappedDlo === dloTable) {
        const aliasRemovalPattern = new RegExp(
          `\\b${escapeRegExp(dloTable)}\\s+(?:AS\\s+)?${escapeRegExp(alias)}\\b`,
          "g"
        );
        result = result.replace(aliasRemovalPattern, dmoTable);
      }
    }
    // Replace remaining standalone table references
    result = result.replaceAll(dloTable, dmoTable);
  }

  return result;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isKeyword(word: string): boolean {
  const keywords = new Set([
    "ON", "WHERE", "AND", "OR", "LEFT", "RIGHT", "INNER", "OUTER",
    "JOIN", "CROSS", "GROUP", "BY", "ORDER", "HAVING", "LIMIT",
    "SELECT", "FROM", "AS", "CASE", "WHEN", "THEN", "ELSE", "END"
  ]);
  return keywords.has(word.toUpperCase());
}
