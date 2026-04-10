# DMO API Bug Fixes Design

**Date:** 2026-04-10
**Source:** Production findings from HFA-Production org testing
**Scope:** 3 bugs — create_dmo field transform, type mapper context, field resolver fallback

## Status of Reported Bugs

| Bug | Status | Notes |
|-----|--------|-------|
| P1: create_dmo input auto-transform | **Partially fixed** — missing field name `__c` stripping and `isPrimaryKey` default |
| P1: Delete tools 204 No Content | **Needs fix** — `http.ts` calls `response.json()` on 204 responses |
| P2: DC token exchange instance_url | **Already fixed** — `auth-manager.ts:86-92` tries all 4 field name variants |
| P2: resolve_field_names stream describe | **Open** — static string transform, no fallback |
| P3: Type mapper context-awareness | **Open** — always converts Date->DateTime regardless of context |
| Opaque error messages | **Already fixed** — `http.ts:169-208` has comprehensive extractErrorMessage |

## Bug 1: `create_dmo` Field Name + isPrimaryKey

### Problem

`transformForCreate` in `src/tools/dmo/create-dmo.ts` handles `__dlm` stripping, `type` -> `dataType`, and removes `keyQualifierName`. But the API also requires:

1. Field names without `__c` suffix — the API auto-appends `__c` to create the final DMO field name
2. `isPrimaryKey: false` on every non-PK field — the API doesn't default this

### Changes

**File: `src/tools/dmo/create-dmo.ts`** — `transformForCreate` field mapping loop:

```
// Strip __c suffix from field names — API auto-appends it
if (typeof f.name === "string" && f.name.endsWith("__c")) {
  f.name = f.name.replace(/__c$/, "");
}

// Ensure isPrimaryKey is explicitly set
if (!("isPrimaryKey" in f) || f.isPrimaryKey !== true) {
  f.isPrimaryKey = false;
}
```

**File: `src/tools/dmo/create-dmo-from-dlo.ts`** — `dloFieldToDmoField` currently returns names like `Provider_c__c` which then go straight into the create payload. The create payload field builder (line 54-61) should strip `__c` from the DMO field name since the API auto-appends it. Add `isPrimaryKey: false` to each generated field.

### Test Cases

- `transformForCreate` strips `__c` from field names (e.g., `Id_c__c` -> `Id_c`)
- `transformForCreate` adds `isPrimaryKey: false` to non-PK fields
- `transformForCreate` preserves `isPrimaryKey: true` on PK fields
- `createDmoFromDloTool` preview shows field names without `__c` suffix
- `createDmoFromDloTool` preview shows `isPrimaryKey: false` on non-PK fields

## Bug 1b: Delete Tools 204 No Content

### Problem

`DELETE /ssot/data-model-objects/{name}` and `DELETE /ssot/calculated-insights/{name}` return 204 No Content on success. The HTTP client's `response.json()` call in `http.ts:136` throws "Unexpected end of JSON input" because there's no body.

### Changes

**File: `src/util/http.ts`** — in the `request` method, after `response.ok` check:

```
if (response.ok) {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }
  return (await response.json()) as T;
}
```

### Test Cases

- HTTP client returns empty object for 204 No Content responses
- HTTP client returns empty object for 200 with content-length 0
- Existing JSON responses still parse normally
- `deleteDmoTool` succeeds when HTTP client returns empty object
- `deleteCalculatedInsightTool` succeeds when HTTP client returns empty object

## Bug 4: `resolve_field_names` Stream Describe Fallback

### Problem

`FieldResolver.resolveFieldMapping` in `src/smart/field-resolver.ts` does a static string transform (`crmFieldName.replace(/__c$/, "_c__c")`) to guess DLO field names. This fails for:

- Formula fields (e.g., `Remaining_Balance__c` -> actual DLO name `Remaining_Balance_formula_c`)
- Renamed fields (e.g., `Account__c` -> actual DLO name `RelatedProvider_c`)
- Truncated fields (e.g., `Default_Modified_Processed_Date__c` -> `Default_Processed_Date_c`)

### Changes

**File: `src/smart/field-resolver.ts`** — `resolveFieldMapping` method:

1. Keep the existing string-based guess as the fast path
2. After guessing, query `POST /ssot/query` with `SELECT * FROM {dlo} LIMIT 0` to get actual column names
3. Check if the guessed name exists in the result columns
4. If not, search columns for a fuzzy match: find a column whose name contains the CRM field's base name (stripped of `__c` suffix and underscores)
5. If the query fails (network error, permissions), fall back to the original guess silently

The DLO column list is cached per DLO name to avoid repeated queries.

```
// New private cache
private dloColumnsCache = new Map<string, string[]>();

// New method
private async getDloColumns(
  dloName: string,
  token: string,
  instanceUrl: string
): Promise<string[] | null>

// Updated resolveFieldMapping to validate guessed name against actual columns
```

### Test Cases

- Returns guessed field name when it matches actual DLO columns
- Falls back to fuzzy match when guess doesn't match (formula field scenario)
- Fuzzy match finds `Remaining_Balance_formula_c` for CRM field `Remaining_Balance__c`
- Falls back to original guess when query fails
- Caches DLO columns across multiple field resolutions on same DLO
- Still works for standard fields that don't need fallback

## Bug 5: Type Mapper Context-Awareness

### Problem

`correctDmoFieldType` in `src/smart/type-mapper.ts` always maps `DATE` -> `DateTime`. This is correct for CI SQL expressions (API quirk #3) but **wrong** for DMO field mappings where DLO and DMO types must match exactly.

From findings:
- CI SQL context: Date -> DateTime, Currency -> Number (API auto-converts)
- Mapping context: Date stays Date, Currency stays Currency (must match DLO exactly)

### Changes

**File: `src/smart/type-mapper.ts`**:

Add a second map for mapping context and a `context` parameter:

```typescript
type TypeMapperContext = "ci" | "mapping";

const CI_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "DateTime",          // CI quirk: Date -> DateTime
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

const MAPPING_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "Date",              // Mapping: keep as Date
  TIMESTAMP: "DateTime",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

export function correctDmoFieldType(
  dloType: string,
  context: TypeMapperContext = "ci"
): string {
  const map = context === "mapping" ? MAPPING_TYPE_MAP : CI_TYPE_MAP;
  return map[dloType] ?? "Text";
}
```

**File: `src/tools/dmo/create-dmo-from-dlo.ts`** — change `correctDmoFieldType(col.type)` call to `correctDmoFieldType(col.type, "mapping")`.

### Test Cases

- `correctDmoFieldType("DATE", "ci")` returns `"DateTime"` (existing behavior)
- `correctDmoFieldType("DATE", "mapping")` returns `"Date"`
- `correctDmoFieldType("DATE")` returns `"DateTime"` (default = ci, backward-compatible)
- `correctDmoFieldType("DECIMAL", "mapping")` returns `"Number"` (unchanged between contexts)
- `create_dmo_from_dlo` uses mapping context for field types

## Implementation Order

1. **Bug 1b: 204 No Content** — smallest change, unblocks delete operations, touches `http.ts` only
2. **Bug 5: Type mapper context** — pure function change, no dependencies on other bugs
3. **Bug 1: create_dmo field transform** — depends on understanding type mapper context for `create_dmo_from_dlo`
4. **Bug 4: Field resolver fallback** — most complex, independent of other bugs but saved for last

## Files Changed

| File | Bugs |
|------|------|
| `src/util/http.ts` | 1b (204 handling) |
| `src/smart/type-mapper.ts` | 5 (context param) |
| `src/tools/dmo/create-dmo.ts` | 1 (field name + isPrimaryKey) |
| `src/tools/dmo/create-dmo-from-dlo.ts` | 1 + 5 (field name + mapping context) |
| `src/smart/field-resolver.ts` | 4 (DLO column fallback) |
| `test/unit/util/http.test.ts` | 1b |
| `test/unit/smart/type-mapper.test.ts` | 5 |
| `test/unit/tools/dmo/create-dmo.test.ts` | 1 |
| `test/unit/tools/dmo/create-dmo-from-dlo.test.ts` | 1 + 5 |
| `test/unit/smart/field-resolver.test.ts` | 4 |
