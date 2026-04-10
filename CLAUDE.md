# CLAUDE.md

## Project

`@chriscamp/sf-data-cloud-mcp` — A Node.js MCP server for Salesforce Data Cloud operations. Provides 35 tools covering DMOs, calculated insights, transforms, data streams, queries, segments, activations, profiles, and health checks with a smart enhancement layer.

## Development Approach

TDD — write the test first, verify it fails, implement, verify it passes, commit. Do not skip tasks or reorder.

## Architecture

- **Runtime:** Node.js 18+, TypeScript, ESM
- **MCP framework:** `@modelcontextprotocol/sdk`
- **Validation:** `zod` for tool input schemas
- **HTTP:** Node built-in `fetch` (no axios/node-fetch)
- **Auth:** `sf org display` via child process for org token, `/services/a360/token` for Data Cloud token
- **No other runtime dependencies**

## Code Conventions

- Each tool in its own file under `src/tools/{category}/`
- Smart layer modules (`src/smart/`) are pure functions where possible
- Error translator (`src/util/errors.ts`) is a single pattern map — one entry per known API error
- All write tools require `confirm: true` parameter — if omitted, return a preview without executing
- Tool files export a single async function that takes validated input + auth + http client and returns structured output
- HTTP client (`src/util/http.ts`) handles retry (3 attempts, exponential backoff) and rate limiting
- Tool registration in `src/index.ts` uses `server.tool()` from `@modelcontextprotocol/sdk`
- Use `z.object({})` schemas from zod for tool input validation
- Return MCP content as `{ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }`

## Testing

- **Framework:** Vitest
- **All tests are mock-based** — no live org calls during automated testing
- **Fixtures** in `test/fixtures/` are real API response shapes captured on 2026-04-08
- Every tool gets a test file in `test/unit/`
- Smart layer modules get dedicated tests
- Error translator gets a test per known pattern
- Run tests with `npm test` — all must pass before committing

## Key Commands

```bash
npm run build          # TypeScript compilation
npm run test           # Run all unit tests
npm run test:watch     # Watch mode
npm run dev            # Watch mode TypeScript compilation
npm run lint           # Type check without emit
npm run format         # Prettier format all .ts files
npm run format:check   # Check formatting without writing
```

## Live Validation

- `node test/validate-live.mjs [org-alias]` — read-only validation against live org
- `node test/probe-api-shapes.mjs [org-alias]` — dump raw API response shapes
- Both scripts are gitignored (contain org-specific references)
- Always run live validation before releasing — mock tests don't catch API shape mismatches

## Build Rules

- Write the test first, then the implementation (TDD)
- Each tool test must cover: request construction, response transformation, error handling
- Do not add dependencies beyond @modelcontextprotocol/sdk and zod
- Use Node 18+ built-in fetch — no axios, no node-fetch
- Keep tool files small and focused — one tool per file
- Smart layer modules must be testable without HTTP mocks (pure input → output where possible)
- Commit after each task or logical group of tools completes with passing tests
- Do not skip tests or mark them as todo/skip

## Release Process

```bash
npm version patch      # bump version (patch/minor/major)
git push origin main --tags
gh release create v0.x.x --title "v0.x.x" --notes "..."
```
GitHub Actions publishes to npm via OIDC trusted publishing — no tokens needed.
Package: https://www.npmjs.com/package/@chriscamp/sf-data-cloud-mcp

## Pre-commit Hooks

- husky + lint-staged runs on every commit
- Staged .ts files: prettier --write + tsc --noEmit
- Do not use `--no-verify` to skip hooks — fix the issue instead

## Sensitive Files

- `docs/` is gitignored — contains org-specific plans, findings, and handoff docs
- `test/validate-live.mjs` and `test/probe-api-shapes.mjs` are gitignored
- Never commit org aliases, instance URLs, or org IDs to the repo
- Test fixtures use generic placeholders (test-org.my.salesforce.com, 00Dxx0000000001)

## API Quirks (from hands-on testing 2026-04-08)

These were discovered during live testing and MUST be handled by the server:

1. **Schedule interval PascalCase** — GET returns `NOT_SCHEDULED`, POST requires `NotScheduled`. Valid POST values: `NotScheduled`, `One`, `Six`, `Twelve`, `TwentyFour`.
2. **CIs require DMOs, not DLOs** — CI expressions must reference `__dlm` tables. The Query API accepts `__dll` tables.
3. **DMO auto-creation type mismatches** — Date columns become DateTime, Currency becomes Number. The type-mapper in `src/smart/type-mapper.ts` must correct these.
4. **Reference table primary key** — DLOs from CSV uploads require `Key__c` field included in DMO mapping.
5. **Custom object field name doubling** — CRM `Field__c` → DLO `Field_c__c` → DMO `Field_c_c__c`. The field resolver handles this.
6. **Data Cloud token subdomain** — The `cdpInstanceUrl` from `/services/a360/token` differs from the org `instanceUrl`. Query API calls must use the DC subdomain.
7. **Dual auth flow** — Connect REST API (`/ssot/`) uses org OAuth token. Query/Insights API (`/api/v1/`) uses Data Cloud token from `/services/a360/token`.

## API Response Shapes (verified 2026-04-09)

- `/ssot/data-model-objects` → `{ dataModelObject: [...] }` (singular key, NOT plural)
- `/ssot/calculated-insights` → `{ collection: { items: [...], total, nextPageToken } }`
- `/ssot/data-streams` → `{ dataStreams: [...], nextPageUrl, totalSize }` (paginated, 10/page)
- `/ssot/segments` → `{ segments: [...], totalSize, batchSize }` (offset pagination)
- `/ssot/search-indexes` → 404 on some orgs (endpoint may not exist)
- `/ssot/query` → returns 201 (not 200), body: `{ data: [...], metadata, rowCount }`
- DELETE endpoints return 204 No Content — do not call response.json()

## DMO Create Schema (differs from GET/describe)

- Object name: strip `__dlm` suffix (API appends it)
- Field type key: `"dataType"` not `"type"`
- Field names: strip `__c` suffix (API appends it)
- Must include `"isPrimaryKey": false` explicitly on non-PK fields
- Remove `keyQualifierName` and `creationType` from create payload
- Type mapper context matters: "mapping" keeps Date/Currency exact, "ci_sql" coerces

## Pagination

- All list tools use `http.paginatedGet()` — never raw `http.get()` for list endpoints
- Three styles: nextPageUrl (streams), nextPageToken (CIs collection), offset fallback (DMOs, segments)
- DMO API returns max 50/page with zero pagination signals — pass `hintBatchSize: 50`
- Paginated calls to large endpoints (79 streams) take 30-60s through MCP stdio
