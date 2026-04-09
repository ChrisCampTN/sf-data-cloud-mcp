---
name: validate
description: Run live validation of all MCP tools against a Salesforce org
disable-model-invocation: true
---

# Live Validation

Run the MCP server live validation suite against a Salesforce org.

## Usage

```
/validate [org-alias]
```

If no org alias is provided, defaults to `HFA-Production`.

## Steps

1. Build the project: `npm run build`
2. Run unit tests: `npm test`
3. Run live validation: `node test/validate-live.mjs <org-alias>`
4. Report results including pagination completeness checks

## Important

- This only runs **read-only** tools against the org
- Write tools are tested via `confirm: false` preview mode only
- Requires `sf` CLI with an authenticated org
