# DMO API Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 production bugs in DMO creation, deletion, type mapping, and field resolution.

**Architecture:** All fixes are isolated to existing modules. No new files. Changes touch `http.ts` (204 handling), `type-mapper.ts` (context param), `create-dmo.ts` + `create-dmo-from-dlo.ts` (field transform), and `field-resolver.ts` (DLO column fallback).

**Tech Stack:** TypeScript, Vitest, zod

**Spec:** `docs/superpowers/specs/2026-04-10-dmo-api-bug-fixes-design.md`

---

### Task 1: HTTP client 204 No Content handling

**Files:**
- Modify: `src/util/http.ts:133-137`
- Test: `test/unit/util/http.test.ts`

- [ ] **Step 1: Write the failing tests**

Add two tests to the existing `describe("DataCloudHttpClient")` block in `test/unit/util/http.test.ts`, after the existing test at line 129:

```typescript
it("returns empty object for 204 No Content response", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    headers: new Map([["content-length", "0"]]),
    json: () => { throw new Error("Unexpected end of JSON input"); }
  });
  vi.stubGlobal("fetch", mockFetch);

  const client = new DataCloudHttpClient();
  const result = await client.delete("https://example.com/api/test", "token123");

  expect(result).toEqual({});
});

it("returns empty object for 200 with content-length 0", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Map([["content-length", "0"]]),
    json: () => { throw new Error("Unexpected end of JSON input"); }
  });
  vi.stubGlobal("fetch", mockFetch);

  const client = new DataCloudHttpClient();
  const result = await client.get("https://example.com/api/test", "token123");

  expect(result).toEqual({});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/unit/util/http.test.ts`
Expected: 2 FAIL — "Unexpected end of JSON input" because `response.json()` is called on empty body.

- [ ] **Step 3: Implement the fix**

In `src/util/http.ts`, replace lines 135-137 (the `response.ok` block inside the `request` method):

```typescript
if (response.ok) {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }
  return (await response.json()) as T;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/unit/util/http.test.ts`
Expected: ALL PASS (existing + 2 new)

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/util/http.ts test/unit/util/http.test.ts
git commit -m "fix: handle 204 No Content in HTTP client

DELETE endpoints return 204 with no body. The client was calling
response.json() which throws on empty responses."
```

---

### Task 2: Type mapper context-awareness

**Files:**
- Modify: `src/smart/type-mapper.ts:1-14`
- Test: `test/unit/smart/type-mapper.test.ts`

- [ ] **Step 1: Write the failing tests**

Add a new describe block to `test/unit/smart/type-mapper.test.ts` after the existing `correctDmoFieldType` describe (after line 27):

```typescript
describe("correctDmoFieldType with context", () => {
  it("maps DATE to DateTime in ci context (default)", () => {
    expect(correctDmoFieldType("DATE")).toBe("DateTime");
    expect(correctDmoFieldType("DATE", "ci")).toBe("DateTime");
  });

  it("maps DATE to Date in mapping context", () => {
    expect(correctDmoFieldType("DATE", "mapping")).toBe("Date");
  });

  it("maps DECIMAL to Number in both contexts", () => {
    expect(correctDmoFieldType("DECIMAL", "ci")).toBe("Number");
    expect(correctDmoFieldType("DECIMAL", "mapping")).toBe("Number");
  });

  it("maps BOOLEAN to Checkbox in both contexts", () => {
    expect(correctDmoFieldType("BOOLEAN", "ci")).toBe("Checkbox");
    expect(correctDmoFieldType("BOOLEAN", "mapping")).toBe("Checkbox");
  });

  it("falls back to Text for unknown types in both contexts", () => {
    expect(correctDmoFieldType("UNKNOWN", "ci")).toBe("Text");
    expect(correctDmoFieldType("UNKNOWN", "mapping")).toBe("Text");
  });
});
```

- [ ] **Step 2: Run tests to verify the new context tests fail**

Run: `npm test -- test/unit/smart/type-mapper.test.ts`
Expected: FAIL on "maps DATE to Date in mapping context" — currently returns "DateTime" for all contexts because the function doesn't accept a context parameter.

- [ ] **Step 3: Implement the fix**

Replace the entire contents of `src/smart/type-mapper.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/unit/smart/type-mapper.test.ts`
Expected: ALL PASS (existing + new context tests)

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/smart/type-mapper.ts test/unit/smart/type-mapper.test.ts
git commit -m "fix: add context param to type mapper for CI vs mapping

DATE must stay Date in DMO field mappings (must match DLO exactly)
but converts to DateTime in CI SQL expressions (API quirk)."
```

---

### Task 3: `create_dmo` field name stripping + isPrimaryKey

**Files:**
- Modify: `src/tools/dmo/create-dmo.ts:29-42`
- Test: `test/unit/tools/dmo/create-dmo.test.ts`

- [ ] **Step 1: Write the failing tests**

Add three tests to the `describe("transformForCreate")` block in `test/unit/tools/dmo/create-dmo.test.ts`, after line 42:

```typescript
it("strips __c suffix from field names", () => {
  const result = transformForCreate({
    name: "Test",
    fields: [
      { name: "Id_c__c", dataType: "Text" },
      { name: "Provider_c__c", dataType: "Text" },
      { name: "Name_c__c", dataType: "Text" }
    ]
  });
  const fields = result.fields as any[];
  expect(fields[0].name).toBe("Id_c");
  expect(fields[1].name).toBe("Provider_c");
  expect(fields[2].name).toBe("Name_c");
});

it("adds isPrimaryKey false to non-PK fields", () => {
  const result = transformForCreate({
    name: "Test",
    fields: [
      { name: "Score", dataType: "Number" },
      { name: "Name", dataType: "Text" }
    ]
  });
  const fields = result.fields as any[];
  expect(fields[0].isPrimaryKey).toBe(false);
  expect(fields[1].isPrimaryKey).toBe(false);
});

it("preserves isPrimaryKey true on PK fields", () => {
  const result = transformForCreate({
    name: "Test",
    fields: [
      { name: "Id", dataType: "Text", isPrimaryKey: true },
      { name: "Score", dataType: "Number" }
    ]
  });
  const fields = result.fields as any[];
  expect(fields[0].isPrimaryKey).toBe(true);
  expect(fields[1].isPrimaryKey).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/unit/tools/dmo/create-dmo.test.ts`
Expected: FAIL — `__c` not stripped, `isPrimaryKey` not set.

- [ ] **Step 3: Implement the fix**

In `src/tools/dmo/create-dmo.ts`, replace the field mapping inside `transformForCreate` (lines 30-41). The full updated block:

```typescript
if (Array.isArray(result.fields)) {
  result.fields = (result.fields as Record<string, unknown>[]).map(field => {
    const f = { ...field };
    // Rename "type" -> "dataType"
    if ("type" in f && !("dataType" in f)) {
      f.dataType = f.type;
      delete f.type;
    }
    // Remove unsupported fields
    delete f.keyQualifierName;
    delete f.creationType;
    // Strip __c suffix from field names — API auto-appends it
    if (typeof f.name === "string" && f.name.endsWith("__c")) {
      f.name = f.name.replace(/__c$/, "");
    }
    // Ensure isPrimaryKey is explicitly set
    if (f.isPrimaryKey !== true) {
      f.isPrimaryKey = false;
    }
    return f;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/unit/tools/dmo/create-dmo.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/tools/dmo/create-dmo.ts test/unit/tools/dmo/create-dmo.test.ts
git commit -m "fix: strip __c suffix and set isPrimaryKey in create_dmo

API auto-appends __c to field names and requires isPrimaryKey to be
explicitly set on every field."
```

---

### Task 4: `create_dmo_from_dlo` field names + mapping context

**Files:**
- Modify: `src/tools/dmo/create-dmo-from-dlo.ts:4,18-25,54-61`
- Test: `test/unit/tools/dmo/create-dmo-from-dlo.test.ts`

- [ ] **Step 1: Write the failing tests**

Add two tests to the `describe("createDmoFromDloTool")` block in `test/unit/tools/dmo/create-dmo-from-dlo.test.ts`, after line 81:

```typescript
it("uses mapping context for field types (DATE stays Date)", async () => {
  const mockHttp = {
    get: vi.fn().mockResolvedValue({ metadata: dloFixture }),
    post: vi.fn()
  };

  const result = await createDmoFromDloTool(
    {
      target_org: "TestOrg",
      dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
      dmo_name: "PRA_BillingAccount__dlm",
      confirm: false
    },
    mockAuth as any,
    mockHttp as any
  );

  // dloFixture has Default_Processed_Date_c__c with type DATE
  // and First_Successful_Payment_Date_Only_c__c with type DATE
  // In mapping context, DATE should stay "Date" not become "DateTime"
  const fields = (result.dmo_definition as any).fields as any[];
  const dateField = fields.find((f: any) =>
    f.name.includes("Default_Processed_Date")
  );
  expect(dateField.dataType).toBe("Date");
});

it("strips __c suffix from DMO field names in create payload", async () => {
  const mockHttp = {
    get: vi.fn().mockResolvedValue({ metadata: dloFixture }),
    post: vi.fn()
  };

  const result = await createDmoFromDloTool(
    {
      target_org: "TestOrg",
      dlo_name: "Billing_Account_c_00Dxx0000000001__dll",
      dmo_name: "PRA_BillingAccount__dlm",
      confirm: false
    },
    mockAuth as any,
    mockHttp as any
  );

  const fields = (result.dmo_definition as any).fields as any[];
  // No field name in the create payload should end with __c
  for (const field of fields) {
    expect(field.name).not.toMatch(/__c$/);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/unit/tools/dmo/create-dmo-from-dlo.test.ts`
Expected: FAIL — DATE fields return "DateTime" (ci context), and field names still end with `__c`.

- [ ] **Step 3: Implement the fix**

In `src/tools/dmo/create-dmo-from-dlo.ts`, make these changes:

**Line 4** — update the import to include the context type:

```typescript
import { correctDmoFieldType, type TypeMapperContext } from "../../smart/type-mapper.js";
```

**Lines 18-25** — update `dloFieldToDmoField` to accept and pass context:

```typescript
function dloFieldToDmoField(dloField: { name: string; type: string }, context: TypeMapperContext = "ci"): { name: string; type: string } {
  const dmoFieldName = dloField.name.endsWith("__c")
    ? dloField.name.replace(/__c$/, "_c__c")
    : dloField.name;

  return { name: dmoFieldName, type: correctDmoFieldType(dloField.type, context) };
}
```

**Lines 54-61** — update the DMO field builder to use mapping context and strip `__c`:

```typescript
const dmoFields = columns.map(col => {
  const mapped = dloFieldToDmoField(col, "mapping");
  // Strip __c suffix — API auto-appends it
  const createName = mapped.name.endsWith("__c")
    ? mapped.name.replace(/__c$/, "")
    : mapped.name;
  return {
    name: createName,
    dataType: mapped.type,
    isPrimaryKey: false,
    label: col.name.replace(/__c$/g, "").replace(/_/g, " ").trim()
  };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/unit/tools/dmo/create-dmo-from-dlo.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS (confirm no regressions from type-mapper context change)

- [ ] **Step 6: Commit**

```bash
git add src/tools/dmo/create-dmo-from-dlo.ts test/unit/tools/dmo/create-dmo-from-dlo.test.ts
git commit -m "fix: use mapping context and strip __c in create_dmo_from_dlo

DATE fields must stay Date in DMO mappings. Field names in create
payload must not have __c suffix (API auto-appends it)."
```

---

### Task 5: Field resolver DLO column fallback

**Files:**
- Modify: `src/smart/field-resolver.ts:47-85`
- Test: `test/unit/smart/field-resolver.test.ts`

- [ ] **Step 1: Update existing tests and write new failing tests**

The existing `resolveFieldMapping` test (line 22-42) mocks only `http.get`. After this change, `resolveFieldMapping` also calls `http.post` for the DLO column query. Update the existing test's mock to include `post`, then add four new tests.

Update the existing test at line 22 — change its `mockHttp` to include a `post` mock that returns the field being tested:

```typescript
it("resolves DLO field to DMO field via mapping", async () => {
  const mockHttp = {
    get: vi
      .fn()
      .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
      .mockResolvedValueOnce(dmoMappingFixture),
    post: vi.fn().mockResolvedValue({
      metadata: {
        columns: [
          { name: "Adjusted_Credit_Score_c__c" },
          { name: "Status_c__c" }
        ]
      }
    })
  };

  const resolver = new FieldResolver(mockHttp as any);
  const mapping = await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Adjusted_Credit_Score__c",
    "token",
    "https://instance.com"
  );

  expect(mapping.dlo).toBe("Billing_Account_c_00Dxx0000000001__dll");
  expect(mapping.dloField).toBe("Adjusted_Credit_Score_c__c");
  expect(mapping.dmo).toBe("PRA_BillingAccount__dlm");
  expect(mapping.dmoField).toBe("Adjusted_Credit_Score_c_c__c");
});
```

Then add four new tests after the updated test:

```typescript
it("falls back to actual DLO columns when guess doesn't match", async () => {
  const mockHttp = {
    get: vi
      .fn()
      .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
      .mockResolvedValueOnce(dmoMappingFixture),
    post: vi.fn().mockResolvedValue({
      metadata: {
        columns: [
          { name: "Remaining_Balance_formula_c__c" },
          { name: "Name__c" },
          { name: "Id__c" }
        ]
      }
    })
  };

  const resolver = new FieldResolver(mockHttp as any);
  const mapping = await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Remaining_Balance__c",
    "token",
    "https://instance.com"
  );

  // Guess would be "Remaining_Balance_c__c" but actual DLO column is
  // "Remaining_Balance_formula_c__c". Should fuzzy-match on "Remaining_Balance".
  expect(mapping.dloField).toBe("Remaining_Balance_formula_c__c");
});

it("uses guessed name when it matches actual DLO columns", async () => {
  const mockHttp = {
    get: vi
      .fn()
      .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
      .mockResolvedValueOnce(dmoMappingFixture),
    post: vi.fn().mockResolvedValue({
      metadata: {
        columns: [
          { name: "Status_c__c" },
          { name: "Name__c" }
        ]
      }
    })
  };

  const resolver = new FieldResolver(mockHttp as any);
  const mapping = await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Status__c",
    "token",
    "https://instance.com"
  );

  // Guess "Status_c__c" matches an actual column — use it directly
  expect(mapping.dloField).toBe("Status_c__c");
});

it("falls back to guessed name when query fails", async () => {
  const mockHttp = {
    get: vi
      .fn()
      .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
      .mockResolvedValueOnce(dmoMappingFixture),
    post: vi.fn().mockRejectedValue(new Error("Network error"))
  };

  const resolver = new FieldResolver(mockHttp as any);
  const mapping = await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Status__c",
    "token",
    "https://instance.com"
  );

  // Query failed — fall back to the string-based guess
  expect(mapping.dloField).toBe("Status_c__c");
});

it("caches DLO columns across multiple resolutions", async () => {
  const mockHttp = {
    get: vi
      .fn()
      .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
      .mockResolvedValueOnce(dmoMappingFixture)
      .mockResolvedValueOnce(dmoMappingFixture),
    post: vi.fn().mockResolvedValue({
      metadata: {
        columns: [
          { name: "Status_c__c" },
          { name: "Name__c" }
        ]
      }
    })
  };

  const resolver = new FieldResolver(mockHttp as any);

  await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Status__c",
    "token",
    "https://instance.com"
  );
  await resolver.resolveFieldMapping(
    "Billing_Account__c",
    "Name",
    "token",
    "https://instance.com"
  );

  // POST (query) should only be called once — second call uses cache
  expect(mockHttp.post).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- test/unit/smart/field-resolver.test.ts`
Expected: FAIL — `resolveFieldMapping` doesn't call `http.post` and always uses the static guess. The "falls back to actual DLO columns" test will fail because the returned `dloField` will be `"Remaining_Balance_c__c"` instead of `"Remaining_Balance_formula_c__c"`.

- [ ] **Step 3: Implement the fix**

Replace the contents of `src/smart/field-resolver.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- test/unit/smart/field-resolver.test.ts`
Expected: ALL PASS (existing 2 + new 4)

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/smart/field-resolver.ts test/unit/smart/field-resolver.test.ts
git commit -m "fix: add DLO column fallback to field resolver

Static CRM->DLO field name transform fails for formula fields,
renamed fields, and truncated names. Now validates the guess against
actual DLO columns via SELECT * LIMIT 0, with fuzzy fallback."
```
