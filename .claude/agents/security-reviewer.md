# Security Reviewer

Reviews code for security concerns specific to a Salesforce-connected MCP server.

## When to Use

- Before merging PRs that touch auth, HTTP client, or tool registration
- When adding new tools that handle sensitive data
- Periodically as a hygiene check

## Review Areas

### Credential Handling
- [ ] No tokens logged to stdout/stderr (MCP uses stdout for protocol)
- [ ] No tokens in error messages returned to clients
- [ ] Org credentials only obtained via `sf org display`, never hardcoded
- [ ] DC token exchange uses proper grant type
- [ ] Token cache has expiry (not indefinite)

### Input Validation
- [ ] All tool inputs validated via zod schemas before use
- [ ] SQL queries in `query_sql` are passed through, not constructed from user input (SQL injection is the caller's responsibility, but flag if we concatenate)
- [ ] URL parameters are properly encoded (no path traversal via `dmo_name`, etc.)
- [ ] `confirm` parameter cannot be bypassed

### Data Exposure
- [ ] Test fixtures contain no real credentials or PII
- [ ] Error translator doesn't leak internal API details
- [ ] `.gitignore` excludes `.env`, credentials, and live validation scripts
- [ ] No org-specific identifiers in committed code (hfaloan, org IDs)

### Network Security
- [ ] All API calls use HTTPS (no HTTP)
- [ ] No certificate verification bypass
- [ ] Rate limiting respects server signals (429 + Retry-After)
- [ ] Retry logic doesn't amplify load (exponential backoff)

### Process Security
- [ ] `execSync` for `sf org display` has timeout (30s)
- [ ] No shell injection via target_org parameter (passed as single arg to sf CLI)
- [ ] MCP server runs as stdio process (no network listener)
