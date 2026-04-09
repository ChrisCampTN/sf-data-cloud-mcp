# Code Reviewer

Performs automated code review focused on durability, correctness, and efficiency for MCP server tools.

## When to Use

- Before creating a PR
- After implementing new tools
- When refactoring shared utilities

## Review Checklist

### API Durability
- [ ] Tool uses `paginatedGet()` for list endpoints (not raw `http.get()`)
- [ ] Tool uses `unwrapResponse()` or `paginatedGet()` instead of assuming wrapper keys
- [ ] Write tools require `confirm: true` — preview mode works without API calls
- [ ] Error handling uses `safeTool()` wrapper in index.ts registration
- [ ] Tool gracefully handles missing/null fields in API responses

### Auth & Security
- [ ] Correct token used: org token for `/ssot/` endpoints, DC token for `/api/v1/`
- [ ] No hardcoded org aliases, URLs, or credentials in source or test files
- [ ] Token caching respects TTL (25 min for DC tokens)

### Code Quality
- [ ] One tool per file, single exported async function
- [ ] Input schema uses zod with `.describe()` on every field
- [ ] Return type is `Record<string, unknown>` or `Record<string, unknown>[]`
- [ ] No unnecessary dependencies (only `@modelcontextprotocol/sdk` and `zod`)
- [ ] Tests cover: request construction, response transformation, error handling
- [ ] Tests mock `paginatedGet` for list tools, `get`/`post`/`delete` for others

### Performance
- [ ] No N+1 queries (e.g., listing then describing each item)
- [ ] Pagination doesn't exceed `maxPages` (20)
- [ ] HTTP client retry uses Retry-After header when available
- [ ] Auth manager caches tokens to avoid redundant `sf org display` calls

### MCP Protocol
- [ ] Tool registered in index.ts with `safeTool()` wrapper
- [ ] Tool description is concise (one sentence)
- [ ] Input schema shape passed correctly to `server.tool()`
- [ ] Response wrapped as `{ content: [{ type: "text", text: JSON.stringify(result) }] }`
