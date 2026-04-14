# CLAUDE.md

## Project

`@chriscamp/sf-data-cloud-mcp` — A Node.js MCP server for Salesforce Data Cloud operations. Provides 36 tools covering DMOs, calculated insights, transforms, data streams, queries, segments, activations, profiles, and health checks with a smart enhancement layer.

## Usage

```jsonc
// Claude Desktop / MCP client config
{
  "mcpServers": {
    "sf-data-cloud": {
      "command": "npx",
      "args": ["-y", "@chriscamp/sf-data-cloud-mcp"],
      "env": { "SF_TARGET_ORG": "<your-org-alias>" }
    }
  }
}
```

Requires Salesforce CLI (`sf`) authenticated to an org with Data Cloud enabled.

## Development Approach

TDD — write the test first, verify it fails, implement, verify it passes, commit. Do not skip tasks or reorder.

## Architecture

- **Runtime:** Node.js 18+, TypeScript, ESM
- **MCP framework:** `@modelcontextprotocol/sdk`
- **Validation:** `zod` for tool input schemas
- **HTTP:** Node built-in `fetch` (no axios/node-fetch)
- **Auth:** `sf org display` via child process for org token, `/services/a360/token` for Data Cloud token
- **No other runtime dependencies**

### Tool Categories

`action` · `activation` · `ci` · `credits` · `dmo` · `health` · `identity` · `profile` · `query` · `segment` · `smart` · `stream` · `transform` — 36 tools total

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
- `unwrap.ts` normalizes varied API response shapes (plural key, singular key, collection pattern, bare array) into `{ items, totalSize?, nextPageUrl? }`

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
```

## Build Rules

- Do not add dependencies beyond @modelcontextprotocol/sdk and zod
- Use Node 18+ built-in fetch — no axios, no node-fetch
- Smart layer modules must be testable without HTTP mocks (pure input → output where possible)
- Commit after each task or logical group of tools completes with passing tests
- Do not skip tests or mark them as todo/skip
- Before committing: verify `npm test` passes, `npm run build` compiles, and the change matches the requested scope
- Flag any intentional behavior change in the commit message — silent semantic shifts cause production bugs
- Before modifying API calls, check the API Quirks section for known issues with that endpoint

## API Quirks (from hands-on testing 2026-04-08)

These were discovered during live testing and MUST be handled by the server:

1. **Schedule interval PascalCase** — GET returns `NOT_SCHEDULED`, POST/PATCH requires `NotScheduled`. Valid POST/PATCH values: `NotScheduled`, `One`, `Six`, `Twelve`, `TwentyFour`. Shared schedule map in `src/tools/ci/schedule-map.ts` handles translation.
2. **CIs require DMOs, not DLOs** — CI expressions must reference `__dlm` tables. The Query API accepts `__dll` tables.
3. **DMO auto-creation type mismatches** — Date columns become DateTime, Currency becomes Number. The type-mapper in `src/smart/type-mapper.ts` must correct these.
4. **Reference table primary key** — DLOs from CSV uploads require `Key__c` field included in DMO mapping.
5. **Custom object field name doubling** — CRM `Field__c` → DLO `Field_c__c` → DMO `Field_c_c__c`. The field resolver handles this.
6. **Data Cloud token subdomain** — The `cdpInstanceUrl` from `/services/a360/token` differs from the org `instanceUrl`. Query API calls must use the DC subdomain.
7. **Dual auth flow** — Connect REST API (`/ssot/`) uses org OAuth token. Query/Insights API (`/api/v1/`) uses Data Cloud token from `/services/a360/token`.
8. **CI PATCH payload must be narrow** — `PATCH /ssot/calculated-insights/{name}` rejects the full GET response body (`Unrecognized field "dataSpace"`). Send only mutable fields: `publishScheduleInterval`, `publishScheduleStartDateTime`, `isEnabled`. When interval is `NotScheduled`, omit `publishScheduleStartDateTime` or the API errors with `Schedule start date must be empty if no schedule is set.`
