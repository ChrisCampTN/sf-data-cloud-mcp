# API Contract Verifier

Probes live Salesforce Data Cloud API endpoints and compares response shapes against what the MCP server code expects. Catches mismatches before they reach users.

## When to Use

- After modifying any tool that calls a Data Cloud API
- Before releasing a new version
- When Salesforce announces API changes

## How It Works

1. Run `test/probe-api-shapes.mjs` to capture live response shapes from every GET endpoint
2. Read each tool's source file to extract the expected response wrapper key
3. Compare: does the tool's unwrap key match what the API actually returns?
4. Report mismatches with specific file paths and line numbers

## Running

```bash
node test/probe-api-shapes.mjs HFA-Production
```

Then compare the output against the `expectedKey` parameters passed to `paginatedGet()` and the wrapper keys used in `http.get()` calls across all tool files.

## Key Patterns to Check

| Endpoint | Expected Shape | Tool File |
|----------|---------------|-----------|
| /ssot/data-model-objects | `{ dataModelObject: [...] }` (singular!) | src/tools/dmo/list-dmos.ts |
| /ssot/calculated-insights | `{ collection: { items: [...] } }` | src/tools/ci/list-calculated-insights.ts |
| /ssot/data-streams | `{ dataStreams: [...], nextPageUrl, totalSize }` | src/tools/stream/list-data-streams.ts |
| /ssot/data-transforms | `{ dataTransforms: [...], totalSize }` | src/tools/transform/list-transforms.ts |
| /ssot/identity-resolutions | `{ identityResolutions: [...] }` | src/tools/identity/list-identity-resolutions.ts |
| /ssot/segments | `{ segments: [...], totalSize }` | src/tools/segment/list-segments.ts |
| /ssot/activations | `{ activations: [...] }` | src/tools/activation/list-activations.ts |
| /ssot/activation-targets | `{ activationTargets: [...] }` | src/tools/activation/list-activation-targets.ts |
| /ssot/data-actions | `{ dataActions: [...] }` | src/tools/action/list-data-actions.ts |
| /ssot/query | `{ data: [...], metadata, rowCount }` | src/tools/query/query-sql.ts |

## What to Flag

- Wrapper key renamed or missing
- Array moved to nested path (e.g., `collection.items`)
- New pagination pattern (different nextPageUrl/token location)
- New required fields in POST bodies
- Status code changes (e.g., 200 → 201 for query)
