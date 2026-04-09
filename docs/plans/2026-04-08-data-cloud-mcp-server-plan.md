# Data Cloud MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npm-publishable MCP server (`@chriscamp/sf-data-cloud-mcp`) providing 35 Data Cloud tools with a smart enhancement layer, using TDD.

**Architecture:** Node.js 18+ MCP server using `@modelcontextprotocol/sdk` and `zod`. Dual auth flow (org OAuth + Data Cloud token exchange). Tools organized by category in `src/tools/`, smart layer in `src/smart/`, utilities in `src/util/`. All tests mock-based using Vitest with real API response fixtures.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `zod`, Vitest, Node 18+ built-in `fetch`

**Design Doc:** `docs/design/2026-04-08-data-cloud-mcp-server.md` in the PayByHFA-Salesforce repo. Refer to it for API quirks (Section 8), tool inventory (Section 3), and smart layer specs (Section 4).

---

## File Structure

```
sf-data-cloud-mcp/
├── src/
│   ├── index.ts                          # MCP server entry, tool registration, CLI arg parsing
│   ├── auth/
│   │   └── auth-manager.ts               # Dual auth: org OAuth via sf CLI + DC token exchange
│   ├── tools/
│   │   ├── health/
│   │   │   └── doctor.ts                 # Connectivity check
│   │   ├── dmo/
│   │   │   ├── list-dmos.ts
│   │   │   ├── describe-dmo.ts
│   │   │   ├── create-dmo.ts
│   │   │   ├── create-dmo-from-dlo.ts    # Smart: uses type-mapper
│   │   │   ├── delete-dmo.ts
│   │   │   ├── list-dmo-mappings.ts
│   │   │   └── create-dmo-mapping.ts
│   │   ├── ci/
│   │   │   ├── list-calculated-insights.ts
│   │   │   ├── create-calculated-insight.ts  # Smart: schedule PascalCase translation
│   │   │   ├── run-calculated-insight.ts
│   │   │   ├── get-calculated-insight-status.ts
│   │   │   └── delete-calculated-insight.ts
│   │   ├── query/
│   │   │   ├── query-sql.ts
│   │   │   ├── describe-table.ts
│   │   │   ├── search-vector.ts
│   │   │   └── search-hybrid.ts
│   │   ├── stream/
│   │   │   ├── list-data-streams.ts
│   │   │   ├── describe-data-stream.ts
│   │   │   └── create-data-stream.ts
│   │   ├── transform/
│   │   │   ├── list-transforms.ts
│   │   │   ├── run-transform.ts
│   │   │   └── get-transform-status.ts
│   │   ├── identity/
│   │   │   ├── list-identity-resolutions.ts
│   │   │   └── describe-identity-resolution.ts
│   │   ├── segment/
│   │   │   ├── list-segments.ts
│   │   │   ├── describe-segment.ts
│   │   │   └── publish-segment.ts
│   │   ├── activation/
│   │   │   ├── list-activations.ts
│   │   │   ├── list-activation-targets.ts
│   │   │   └── create-activation.ts
│   │   ├── profile/
│   │   │   └── query-profile.ts
│   │   ├── action/
│   │   │   └── list-data-actions.ts
│   │   └── credits/
│   │       └── estimate-flex-credits.ts  # Calculator + live usage query
│   ├── smart/
│   │   ├── field-resolver.ts
│   │   ├── type-mapper.ts
│   │   └── sql-translator.ts
│   └── util/
│       ├── http.ts                       # REST client with retry + rate limiting
│       └── errors.ts                     # API error pattern → actionable message
├── test/
│   ├── fixtures/
│   │   ├── calculated-insight-list.json
│   │   ├── calculated-insight-list-raw.json
│   │   ├── data-stream-list.json
│   │   ├── dmo-list.json
│   │   ├── dmo-describe-billing-account.json
│   │   ├── dmo-describe-credit-tier.json
│   │   ├── dmo-mapping-list.json
│   │   ├── dlo-describe-billing-account.json
│   │   ├── dlo-describe-credit-tier.json
│   │   ├── credit-tier-query-results.json
│   │   ├── billing-account-joined-query.json
│   │   ├── doctor-response.json
│   │   ├── identity-resolution-list.json
│   │   ├── segment-list.json
│   │   ├── data-stream-describe.json
│   │   ├── transform-list.json
│   │   ├── activation-list-empty.json
│   │   ├── activation-target-list-empty.json
│   │   ├── data-action-list-empty.json
│   │   ├── search-index-list.json
│   │   ├── error-schedule-interval.json
│   │   ├── error-fact-table-dll.json
│   │   ├── error-type-mismatch.json
│   │   ├── error-missing-primary-key.json
│   │   └── error-missing-definition-type.json
│   └── unit/
│       ├── auth/
│       │   └── auth-manager.test.ts
│       ├── util/
│       │   ├── http.test.ts
│       │   └── errors.test.ts
│       ├── tools/
│       │   ├── health/
│       │   │   └── doctor.test.ts
│       │   ├── dmo/
│       │   │   ├── list-dmos.test.ts
│       │   │   ├── describe-dmo.test.ts
│       │   │   ├── create-dmo.test.ts
│       │   │   ├── create-dmo-from-dlo.test.ts
│       │   │   ├── delete-dmo.test.ts
│       │   │   ├── list-dmo-mappings.test.ts
│       │   │   └── create-dmo-mapping.test.ts
│       │   ├── ci/
│       │   │   ├── list-calculated-insights.test.ts
│       │   │   ├── create-calculated-insight.test.ts
│       │   │   ├── run-calculated-insight.test.ts
│       │   │   ├── get-calculated-insight-status.test.ts
│       │   │   └── delete-calculated-insight.test.ts
│       │   ├── query/
│       │   │   ├── query-sql.test.ts
│       │   │   ├── describe-table.test.ts
│       │   │   ├── search-vector.test.ts
│       │   │   └── search-hybrid.test.ts
│       │   ├── stream/
│       │   │   ├── list-data-streams.test.ts
│       │   │   ├── describe-data-stream.test.ts
│       │   │   └── create-data-stream.test.ts
│       │   ├── transform/
│       │   │   ├── list-transforms.test.ts
│       │   │   ├── run-transform.test.ts
│       │   │   └── get-transform-status.test.ts
│       │   ├── identity/
│       │   │   ├── list-identity-resolutions.test.ts
│       │   │   └── describe-identity-resolution.test.ts
│       │   ├── segment/
│       │   │   ├── list-segments.test.ts
│       │   │   ├── describe-segment.test.ts
│       │   │   └── publish-segment.test.ts
│       │   ├── activation/
│       │   │   ├── list-activations.test.ts
│       │   │   ├── list-activation-targets.test.ts
│       │   │   └── create-activation.test.ts
│       │   ├── profile/
│       │   │   └── query-profile.test.ts
│       │   ├── action/
│       │   │   └── list-data-actions.test.ts
│       │   └── credits/
│       │       └── estimate-flex-credits.test.ts
│       └── smart/
│           ├── field-resolver.test.ts
│           ├── type-mapper.test.ts
│           └── sql-translator.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md
└── README.md
```

---

## Task 0: Create GitHub Repo and Scaffold Project

**Files:**

- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `CLAUDE.md`, `README.md`, `.gitignore`, `src/index.ts`

- [ ] **Step 0.1: Create the GitHub repo**

```bash
gh repo create ChrisCampTN/sf-data-cloud-mcp --public --clone --description "MCP server for Salesforce Data Cloud operations"
cd sf-data-cloud-mcp
```

- [ ] **Step 0.2: Initialize package.json**

```bash
npm init -y
```

Then replace contents of `package.json`:

```json
{
  "name": "@chriscamp/sf-data-cloud-mcp",
  "version": "0.1.0",
  "description": "MCP server for Salesforce Data Cloud operations",
  "type": "module",
  "bin": {
    "sf-data-cloud-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["mcp", "salesforce", "data-cloud", "ai"],
  "author": "Chris Camp",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/ChrisCampTN/sf-data-cloud-mcp.git"
  }
}
```

- [ ] **Step 0.3: Install dependencies**

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D typescript vitest @types/node
```

- [ ] **Step 0.4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 0.5: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: ".",
    include: ["test/**/*.test.ts"]
  }
});
```

- [ ] **Step 0.6: Create .gitignore**

```
node_modules/
dist/
*.log
.env
```

- [ ] **Step 0.7: Create CLAUDE.md**

Write the full CLAUDE.md from Appendix A of the design doc (`docs/design/2026-04-08-data-cloud-mcp-server.md`, Section "Appendix A"). Copy it verbatim — it contains the build rules, code conventions, testing rules, and key commands the overnight agent needs.

- [ ] **Step 0.8: Create stub src/index.ts**

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "sf-data-cloud-mcp",
  version: "0.1.0"
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 0.9: Create README.md**

````markdown
# @chriscamp/sf-data-cloud-mcp

MCP server for Salesforce Data Cloud operations. Provides 35 tools covering DMOs, calculated insights, transforms, data streams, queries, segments, activations, profiles, and health checks.

## Installation

```bash
npx -y @chriscamp/sf-data-cloud-mcp@latest --orgs ALLOW_ALL_ORGS
```
````

## Prerequisites

- Node.js 18+
- Salesforce CLI (`sf`) with authenticated org
- Data Cloud enabled on the target org

````

- [ ] **Step 0.10: Verify build and test pass**

```bash
npm run build
npm test
````

Expected: Build succeeds (empty index.ts compiles). Tests pass (no test files yet = 0 tests, 0 failures).

- [ ] **Step 0.11: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with MCP SDK, TypeScript, Vitest"
```

---

## Task 1: Test Fixtures

**Files:**

- Create: all files in `test/fixtures/`

- [ ] **Step 1.1: Create fixture directory and all JSON fixture files**

Create `test/fixtures/` directory and populate with real API response data. Each fixture is a JSON file containing the exact response body from a Data Cloud API call captured from HFA-Production on 2026-04-08.

`test/fixtures/doctor-response.json`:

```json
{
  "status": "ok",
  "org": "chris@hfaloan.com",
  "apiVersion": "66.0",
  "indexes": 3,
  "instanceUrl": "https://hfaloan.my.salesforce.com"
}
```

`test/fixtures/calculated-insight-list.json`:

```json
[
  {
    "apiName": "DailyPersonalizationRequests__cio",
    "displayName": "Daily Personalization Requests",
    "calculatedInsightStatus": "ACTIVE"
  },
  {
    "apiName": "DailyPersonalizationUniques__cio",
    "displayName": "Daily Personalization Uniques",
    "calculatedInsightStatus": "ACTIVE"
  },
  {
    "apiName": "PRA_Credit_Tier_Assignment__cio",
    "displayName": "PRA Credit Tier Assignment",
    "calculatedInsightStatus": "ACTIVE"
  }
]
```

`test/fixtures/calculated-insight-list-raw.json`:

```json
[
  {
    "apiName": "PRA_Credit_Tier_Assignment__cio",
    "calculatedInsightStatus": "ACTIVE",
    "creationType": "Custom",
    "dataSpace": "default",
    "definitionStatus": "IN_USE",
    "definitionType": "CALCULATED_METRIC",
    "description": "CI #1: Assigns credit tier and term group to every Billing Account.",
    "displayName": "PRA Credit Tier Assignment",
    "expression": "SELECT PRA_BillingAccount__dlm.Provider_c_c__c AS ProviderId__c, PRA_CreditTierModels__dlm.TierName_c__c AS CreditTier__c, CASE WHEN PRA_BillingAccount__dlm.Term_c_c__c <= 3 THEN 'Short' WHEN PRA_BillingAccount__dlm.Term_c_c__c <= 6 THEN 'Medium' ELSE 'Standard' END AS TermGroup__c, COUNT(PRA_BillingAccount__dlm.Id_c__c) AS AccountCount__c FROM PRA_BillingAccount__dlm LEFT OUTER JOIN PRA_CreditTierModels__dlm ON (PRA_BillingAccount__dlm.Adjusted_Credit_Score_c_c__c >= PRA_CreditTierModels__dlm.MinScore_c__c AND PRA_BillingAccount__dlm.Adjusted_Credit_Score_c_c__c <= PRA_CreditTierModels__dlm.MaxScore_c__c AND PRA_CreditTierModels__dlm.IsActive_c__c = true) GROUP BY ProviderId__c, CreditTier__c, TermGroup__c",
    "isEnabled": true,
    "lastRunStatus": "SUCCESS",
    "publishScheduleInterval": "NOT_SCHEDULED",
    "dimensions": [],
    "measures": []
  }
]
```

`test/fixtures/dmo-list.json`:

```json
[
  {
    "name": "ssot__Account__dlm",
    "label": "Account",
    "category": "PROFILE",
    "fields": 115,
    "isSegmentable": true,
    "dataSpace": "default"
  },
  {
    "name": "PRA_BillingAccount__dlm",
    "label": "PRA Billing Account",
    "category": "OTHER",
    "fields": 13,
    "isSegmentable": false,
    "dataSpace": "default"
  },
  {
    "name": "PRA_CreditTierModels__dlm",
    "label": "PRA Credit Tier Models",
    "category": "OTHER",
    "fields": 6,
    "isSegmentable": false,
    "dataSpace": "default"
  }
]
```

`test/fixtures/dmo-describe-billing-account.json`:

```json
{
  "category": "OTHER",
  "creationType": "Custom",
  "dataSpaceName": "default",
  "name": "PRA_BillingAccount__dlm",
  "fields": [
    {
      "name": "Adjusted_Credit_Score_c_c__c",
      "type": "Number",
      "label": "Adjusted Credit Score c",
      "creationType": "Custom"
    },
    {
      "name": "Status_c_c__c",
      "type": "Text",
      "label": "Status c",
      "creationType": "Custom"
    },
    {
      "name": "Term_c_c__c",
      "type": "Number",
      "label": "Term c",
      "creationType": "Custom"
    },
    {
      "name": "Provider_c_c__c",
      "type": "Text",
      "label": "Provider c",
      "creationType": "Custom"
    },
    {
      "name": "Id_c__c",
      "type": "Text",
      "label": "Id c",
      "creationType": "Custom"
    },
    {
      "name": "Type_c_c__c",
      "type": "Text",
      "label": "Type c",
      "creationType": "Custom"
    },
    {
      "name": "Default_Type_c_c__c",
      "type": "Text",
      "label": "Default Type c",
      "creationType": "Custom"
    },
    {
      "name": "Dispute_Lost_Default_c_c__c",
      "type": "Checkbox",
      "label": "Dispute Lost Default c",
      "creationType": "Custom"
    },
    {
      "name": "MadePayments_c_c__c",
      "type": "Number",
      "label": "MadePayments c",
      "creationType": "Custom"
    },
    {
      "name": "Made_Recission_Payments_c_c__c",
      "type": "Number",
      "label": "Made Recission Payments c",
      "creationType": "Custom"
    },
    {
      "name": "Required_Consecutive_Payments_c_c__c",
      "type": "Number",
      "label": "Required Consecutive Payments c",
      "creationType": "Custom"
    },
    {
      "name": "Name_c__c",
      "type": "Text",
      "label": "Name c",
      "creationType": "Custom"
    },
    {
      "name": "Recission_Window_Type_c_c__c",
      "type": "Text",
      "label": "Recission Window Type c",
      "creationType": "Custom"
    },
    {
      "name": "DataSource__c",
      "type": "Text",
      "label": "Data Source",
      "creationType": "System"
    },
    {
      "name": "DataSourceObject__c",
      "type": "Text",
      "label": "Data Source Object",
      "creationType": "System"
    }
  ]
}
```

`test/fixtures/dmo-mapping-list.json`:

```json
{
  "sourceDlo": "Billing_Account_c_00Df20000018YWM__dll",
  "targetDmo": "PRA_BillingAccount__dlm",
  "status": "ACTIVE",
  "mappings": [
    {
      "sourceField": "Adjusted_Credit_Score_c__c",
      "targetField": "Adjusted_Credit_Score_c_c__c"
    },
    { "sourceField": "Status_c__c", "targetField": "Status_c_c__c" },
    { "sourceField": "Term_c__c", "targetField": "Term_c_c__c" },
    { "sourceField": "Provider_c__c", "targetField": "Provider_c_c__c" },
    { "sourceField": "Id__c", "targetField": "Id_c__c" },
    { "sourceField": "Type_c__c", "targetField": "Type_c_c__c" },
    {
      "sourceField": "Default_Type_c__c",
      "targetField": "Default_Type_c_c__c"
    },
    {
      "sourceField": "Dispute_Lost_Default_c__c",
      "targetField": "Dispute_Lost_Default_c_c__c"
    },
    {
      "sourceField": "MadePayments_c__c",
      "targetField": "MadePayments_c_c__c"
    },
    {
      "sourceField": "Made_Recission_Payments_c__c",
      "targetField": "Made_Recission_Payments_c_c__c"
    },
    {
      "sourceField": "Required_Consecutive_Payments_c__c",
      "targetField": "Required_Consecutive_Payments_c_c__c"
    },
    { "sourceField": "Name__c", "targetField": "Name_c__c" },
    {
      "sourceField": "Recission_Window_Type_c__c",
      "targetField": "Recission_Window_Type_c_c__c"
    },
    { "sourceField": "DataSource__c", "targetField": "DataSource__c" },
    {
      "sourceField": "DataSourceObject__c",
      "targetField": "DataSourceObject__c"
    },
    { "sourceField": "KQ_Id__c", "targetField": "KQ_Id_c__c" }
  ]
}
```

`test/fixtures/dlo-describe-billing-account.json`:

```json
{
  "table": "Billing_Account_c_00Df20000018YWM__dll",
  "columns": [
    { "name": "Default_Processed_Date_c__c", "type": "DATE" },
    { "name": "Status_c__c", "type": "VARCHAR" },
    { "name": "Made_Recission_Payments_c__c", "type": "DECIMAL" },
    { "name": "cdp_sys_record_currency__c", "type": "VARCHAR" },
    { "name": "Adjusted_Credit_Score_c__c", "type": "DECIMAL" },
    { "name": "Default_Type_c__c", "type": "VARCHAR" },
    { "name": "Amount_c__c", "type": "DECIMAL" },
    { "name": "Required_Consecutive_Payments_c__c", "type": "DECIMAL" },
    { "name": "Type_c__c", "type": "VARCHAR" },
    { "name": "Id__c", "type": "VARCHAR" },
    { "name": "Name__c", "type": "VARCHAR" },
    { "name": "Recission_Window_Type_c__c", "type": "VARCHAR" },
    { "name": "Dispute_Lost_Default_c__c", "type": "BOOLEAN" },
    { "name": "Term_c__c", "type": "DECIMAL" },
    { "name": "Remaining_Balance_formula_c__c", "type": "DECIMAL" },
    { "name": "MadePayments_c__c", "type": "DECIMAL" },
    { "name": "Provider_c__c", "type": "VARCHAR" },
    { "name": "First_Successful_Payment_Date_Only_c__c", "type": "DATE" }
  ]
}
```

`test/fixtures/dlo-describe-credit-tier.json`:

```json
{
  "table": "credit_tier_models__dll",
  "columns": [
    { "name": "Version__c", "type": "VARCHAR" },
    { "name": "Key__c", "type": "VARCHAR" },
    { "name": "MinScore__c", "type": "DECIMAL" },
    { "name": "TierName__c", "type": "VARCHAR" },
    { "name": "MaxScore__c", "type": "DECIMAL" },
    { "name": "IsActive__c", "type": "BOOLEAN" }
  ]
}
```

`test/fixtures/credit-tier-query-results.json`:

```json
{
  "data": [
    {
      "TierName__c": "0-579",
      "MinScore__c": 0,
      "MaxScore__c": 579,
      "Version__c": "2025-12",
      "IsActive__c": true
    },
    {
      "TierName__c": "580-619",
      "MinScore__c": 580,
      "MaxScore__c": 619,
      "Version__c": "2025-12",
      "IsActive__c": true
    },
    {
      "TierName__c": "620-719",
      "MinScore__c": 620,
      "MaxScore__c": 719,
      "Version__c": "2025-12",
      "IsActive__c": true
    },
    {
      "TierName__c": "720+",
      "MinScore__c": 720,
      "MaxScore__c": 850,
      "Version__c": "2025-12",
      "IsActive__c": true
    }
  ],
  "metadata": { "rowCount": 4 }
}
```

`test/fixtures/identity-resolution-list.json`:

```json
[
  {
    "label": "MC - Identity Resolution",
    "status": "PUBLISHED",
    "lastJobStatus": "SUCCESS",
    "unifiedProfiles": 205613,
    "consolidationPercent": 29
  },
  { "label": "Individual Identity Resolution", "status": "PUBLISHED" },
  {
    "label": "MC - Account Resolution",
    "status": "PUBLISHED",
    "lastJobStatus": "SUCCESS",
    "unifiedProfiles": 150702,
    "consolidationPercent": 0
  }
]
```

`test/fixtures/segment-list.json`:

```json
[
  {
    "apiName": "Test",
    "displayName": "Test",
    "status": "ACTIVE",
    "type": "UI",
    "members": 3
  },
  {
    "apiName": "Test_2",
    "displayName": "Test 2",
    "status": "ACTIVE",
    "type": "UI",
    "members": 202174
  }
]
```

`test/fixtures/data-stream-list.json`:

```json
[
  {
    "name": "Account_00Df20000018YWM",
    "label": "Account_00Df20000018YWM",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "SalesforceDotCom",
    "type": "SFDC_PACKAGE_KIT",
    "records": 150776
  },
  {
    "name": "Balance_Sheet_Entry_c_00Df20000018YWM",
    "label": "Balance_Sheet_Entry__c_00Df20000018YWM",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "SalesforceDotCom",
    "type": "SFDC",
    "records": 1132970
  },
  {
    "name": "Billing_Account_c_00Df20000018YWM",
    "label": "Billing_Account__c_00Df20000018YWM",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "SalesforceDotCom",
    "type": "SFDC",
    "records": 139481
  },
  {
    "name": "Billing_Transaction_c_00Df20000018YWM",
    "label": "Billing_Transaction__c_00Df20000018YWM",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "SalesforceDotCom",
    "type": "SFDC",
    "records": 1115517
  },
  {
    "name": "BillingAccountStatusHist_00Df20000018YWM",
    "label": "BillingAccountStatusHist_00Df20000018YWM",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "SalesforceDotCom",
    "type": "SFDC",
    "records": 369938
  },
  {
    "name": "credit_tier_models",
    "label": "credit_tier_models",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "UploadedFiles",
    "type": "CONNECTORSFRAMEWORK",
    "records": 10
  },
  {
    "name": "Pricing_Model_Default_Curves",
    "label": "Pricing Model Default Curves",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "connector": "UploadedFiles",
    "type": "CONNECTORSFRAMEWORK",
    "records": 48
  }
]
```

`test/fixtures/transform-list.json`:

```json
[
  {
    "name": "ExtractVideoEngmtParticipants_00Df20000018YWM",
    "label": "ExtractVideoEngmtParticipants_00Df20000018YWM",
    "type": "BATCH",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "lastRunDate": "2026-04-08T22:09:01.000Z"
  },
  {
    "name": "Dg_Billing_Transaction_1753376340706",
    "label": "Dg_Billing_Transaction_1753376340706",
    "type": "BATCH",
    "status": "ACTIVE",
    "lastRunStatus": "SUCCESS",
    "lastRunDate": "2026-04-08T17:09:48.000Z"
  }
]
```

`test/fixtures/search-index-list.json`:

```json
[
  {
    "name": "ConversationTranscriptSearch",
    "status": "READY",
    "type": "HYBRID",
    "sourceDmo": "ssot__ConversationEntry__dlm"
  },
  {
    "name": "KA_HFA_Service",
    "status": "IN_PROGRESS",
    "type": "HYBRID",
    "sourceDmo": "ssot__KnowledgeArticleVersion__dlm"
  },
  {
    "name": "SetupPageSearchMetadataIndex_K7M3X",
    "status": "READY",
    "type": "HYBRID",
    "sourceDmo": "SetupPageSearchMetadata__dlm"
  }
]
```

`test/fixtures/activation-list-empty.json`:

```json
[]
```

`test/fixtures/activation-target-list-empty.json`:

```json
[]
```

`test/fixtures/data-action-list-empty.json`:

```json
[]
```

`test/fixtures/error-schedule-interval.json`:

```json
{
  "errorCode": "INVALID_VALUE",
  "message": "Invalid value for Invalid Calculated Insight Publish Schedule Interval: DAILY"
}
```

`test/fixtures/error-fact-table-dll.json`:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Error getting FactTable Billing_Account_c_00Df20000018YWM__dll, FullColumnName Billing_Account_c_00Df20000018YWM__dll.Provider_c__c cannot be found in dependencies or existing DMOs"
}
```

`test/fixtures/error-type-mismatch.json`:

```json
{
  "errorCode": "MAPPING_ERROR",
  "message": "Default_Processed_Date_c__c 's type Date is different from Default_Processed_Date_c_c__c 's type DateTime"
}
```

`test/fixtures/error-missing-primary-key.json`:

```json
{
  "errorCode": "MAPPING_ERROR",
  "message": "Unable to find Primary Key of DLO in POST request of Mapping Creation"
}
```

`test/fixtures/error-missing-definition-type.json`:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "The Definition Type is not supported"
}
```

- [ ] **Step 1.2: Commit**

```bash
git add test/fixtures/
git commit -m "feat: add API response fixtures from HFA-Production 2026-04-08"
```

---

## Task 2: HTTP Client and Error Translator

**Files:**

- Create: `src/util/http.ts`, `src/util/errors.ts`
- Test: `test/unit/util/http.test.ts`, `test/unit/util/errors.test.ts`

- [ ] **Step 2.1: Write failing test for error translator**

`test/unit/util/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { translateError } from "../../src/util/errors.js";

describe("translateError", () => {
  it("translates schedule interval error", () => {
    const msg =
      "Invalid value for Invalid Calculated Insight Publish Schedule Interval: DAILY";
    const result = translateError(msg);
    expect(result).toContain("NotScheduled");
    expect(result).toContain("TwentyFour");
    expect(result).toContain("DAILY");
  });

  it("translates DLO fact table error", () => {
    const msg =
      "Error getting FactTable Billing_Account_c_00Df20000018YWM__dll";
    const result = translateError(msg);
    expect(result).toContain("__dlm");
    expect(result).toContain("resolve_field_names");
  });

  it("translates field not found in DMOs error", () => {
    const msg =
      "FullColumnName PRA_CreditTierModels__dlm.TierName__c cannot be found in dependencies or existing DMOs";
    const result = translateError(msg);
    expect(result).toContain("describe_dmo");
    expect(result).toContain("_c_c__c");
  });

  it("translates type mismatch error", () => {
    const msg =
      "Default_Processed_Date_c__c 's type Date is different from Default_Processed_Date_c_c__c 's type DateTime";
    const result = translateError(msg);
    expect(result).toContain("create_dmo_from_dlo");
    expect(result).toContain("Date/Currency");
  });

  it("translates missing primary key error", () => {
    const msg =
      "Unable to find Primary Key of DLO in POST request of Mapping Creation";
    const result = translateError(msg);
    expect(result).toContain("Key__c");
  });

  it("translates missing definition type error", () => {
    const msg = "The Definition Type is not supported";
    const result = translateError(msg);
    expect(result).toContain("CALCULATED_METRIC");
  });

  it("passes through unrecognized errors", () => {
    const msg = "Something completely unknown happened";
    const result = translateError(msg);
    expect(result).toBe(msg);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
npm test -- test/unit/util/errors.test.ts
```

Expected: FAIL — `translateError` not found.

- [ ] **Step 2.3: Implement error translator**

`src/util/errors.ts`:

```typescript
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
    translate: () =>
      `Reference table DLOs require a Key field in the mapping. Include Key__c in your field list.`
  },
  {
    pattern: /The Definition Type is not supported/i,
    translate: () =>
      `Missing definitionType field. Add "definitionType": "CALCULATED_METRIC" to your CI definition.`
  },
  {
    pattern: /Missing required field\(s\):\s*(.+)/i,
    translate: (match) =>
      `Missing required field(s): ${match[1]}. Check the design doc Section 8 for expected formats.`
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
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
npm test -- test/unit/util/errors.test.ts
```

Expected: PASS — all 7 tests green.

- [ ] **Step 2.5: Write failing test for HTTP client**

`test/unit/util/http.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataCloudHttpClient } from "../../src/util/http.js";

describe("DataCloudHttpClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makes GET request with auth header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.get("https://example.com/api/test", "token123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token123"
        })
      })
    );
    expect(result).toEqual({ data: "test" });
  });

  it("makes POST request with JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ created: true })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    const result = await client.post(
      "https://example.com/api/test",
      "token123",
      { name: "test" }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api/test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ name: "test" })
      })
    );
    expect(result).toEqual({ created: true });
  });

  it("throws translated error on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: "The Definition Type is not supported" })
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient();
    await expect(
      client.get("https://example.com/api/test", "token123")
    ).rejects.toThrow("CALCULATED_METRIC");
  });

  it("retries on 429 and 5xx", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: "rate limited" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "ok" })
      });
    vi.stubGlobal("fetch", mockFetch);

    const client = new DataCloudHttpClient({ retryDelayMs: 1 });
    const result = await client.get("https://example.com/api/test", "token123");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: "ok" });
  });
});
```

- [ ] **Step 2.6: Run test to verify it fails**

```bash
npm test -- test/unit/util/http.test.ts
```

Expected: FAIL — `DataCloudHttpClient` not found.

- [ ] **Step 2.7: Implement HTTP client**

`src/util/http.ts`:

```typescript
import { translateError } from "./errors.js";

interface HttpClientOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export class DataCloudHttpClient {
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(options: HttpClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
  }

  async get<T = unknown>(url: string, token: string): Promise<T> {
    return this.request<T>("GET", url, token);
  }

  async post<T = unknown>(
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>("POST", url, token, body);
  }

  async delete<T = unknown>(url: string, token: string): Promise<T> {
    return this.request<T>("DELETE", url, token);
  }

  async patch<T = unknown>(
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>("PATCH", url, token, body);
  }

  private async request<T>(
    method: string,
    url: string,
    token: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      };
      const init: RequestInit = { method, headers };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);

      if (response.ok) {
        return (await response.json()) as T;
      }

      const errorBody = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        (errorBody as { message?: string }).message ??
        `HTTP ${response.status}`;

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < this.maxRetries
      ) {
        lastError = new Error(errorMessage);
        await new Promise((r) =>
          setTimeout(r, this.retryDelayMs * Math.pow(2, attempt))
        );
        continue;
      }

      throw new Error(translateError(errorMessage));
    }

    throw lastError ?? new Error("Request failed after retries");
  }
}
```

- [ ] **Step 2.8: Run tests to verify they pass**

```bash
npm test -- test/unit/util/
```

Expected: PASS — all tests green.

- [ ] **Step 2.9: Commit**

```bash
git add src/util/ test/unit/util/
git commit -m "feat: add HTTP client with retry and error translator"
```

---

## Task 3: Auth Manager

**Files:**

- Create: `src/auth/auth-manager.ts`
- Test: `test/unit/auth/auth-manager.test.ts`

- [ ] **Step 3.1: Write failing test for auth manager**

`test/unit/auth/auth-manager.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "../../src/auth/auth-manager.js";

vi.mock("child_process", () => ({
  execSync: vi.fn()
}));

describe("AuthManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gets org token from sf org display", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://hfaloan.my.salesforce.com",
            username: "chris@hfaloan.com"
          }
        })
      )
    );

    const auth = new AuthManager();
    const creds = await auth.getOrgCredentials("HFA-Production");

    expect(creds.accessToken).toBe("org-token-123");
    expect(creds.instanceUrl).toBe("https://hfaloan.my.salesforce.com");
    expect(vi.mocked(execSync)).toHaveBeenCalledWith(
      expect.stringContaining(
        "sf org display --target-org HFA-Production --json"
      ),
      expect.any(Object)
    );
  });

  it("caches org token for same alias", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://hfaloan.my.salesforce.com",
            username: "chris@hfaloan.com"
          }
        })
      )
    );

    const auth = new AuthManager();
    await auth.getOrgCredentials("HFA-Production");
    await auth.getOrgCredentials("HFA-Production");

    expect(vi.mocked(execSync)).toHaveBeenCalledTimes(1);
  });

  it("exchanges org token for Data Cloud token", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://hfaloan.my.salesforce.com",
            username: "chris@hfaloan.com"
          }
        })
      )
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "dc-token-456",
          instance_url: "https://hfaloan.dc.salesforce.com",
          token_type: "Bearer"
        })
    });
    vi.stubGlobal("fetch", mockFetch);

    const auth = new AuthManager();
    const creds = await auth.getDataCloudCredentials("HFA-Production");

    expect(creds.accessToken).toBe("dc-token-456");
    expect(creds.instanceUrl).toBe("https://hfaloan.dc.salesforce.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hfaloan.my.salesforce.com/services/a360/token",
      expect.objectContaining({ method: "POST" })
    );
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

```bash
npm test -- test/unit/auth/auth-manager.test.ts
```

Expected: FAIL — `AuthManager` not found.

- [ ] **Step 3.3: Implement auth manager**

`src/auth/auth-manager.ts`:

```typescript
import { execSync } from "child_process";

export interface OrgCredentials {
  accessToken: string;
  instanceUrl: string;
  username: string;
}

export interface DataCloudCredentials {
  accessToken: string;
  instanceUrl: string;
}

export class AuthManager {
  private orgCache = new Map<string, OrgCredentials>();
  private dcCache = new Map<
    string,
    { creds: DataCloudCredentials; expiresAt: number }
  >();

  async getOrgCredentials(targetOrg: string): Promise<OrgCredentials> {
    const cached = this.orgCache.get(targetOrg);
    if (cached) return cached;

    const output = execSync(`sf org display --target-org ${targetOrg} --json`, {
      encoding: "utf-8",
      timeout: 30000
    });

    const parsed = JSON.parse(output);
    const result = parsed.result;

    const creds: OrgCredentials = {
      accessToken: result.accessToken,
      instanceUrl: result.instanceUrl,
      username: result.username
    };

    this.orgCache.set(targetOrg, creds);
    return creds;
  }

  async getDataCloudCredentials(
    targetOrg: string
  ): Promise<DataCloudCredentials> {
    const cached = this.dcCache.get(targetOrg);
    if (cached && cached.expiresAt > Date.now()) return cached.creds;

    const orgCreds = await this.getOrgCredentials(targetOrg);

    const response = await fetch(
      `${orgCreds.instanceUrl}/services/a360/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${orgCreds.accessToken}`
        },
        body: "grant_type=urn:salesforce:grant-type:external:cdp"
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Data Cloud token exchange failed: ${JSON.stringify(errorBody)}`
      );
    }

    const tokenResponse = (await response.json()) as {
      access_token: string;
      instance_url: string;
      token_type: string;
    };

    const creds: DataCloudCredentials = {
      accessToken: tokenResponse.access_token,
      instanceUrl: tokenResponse.instance_url
    };

    this.dcCache.set(targetOrg, {
      creds,
      expiresAt: Date.now() + 25 * 60 * 1000 // 25 min TTL (tokens expire ~30 min)
    });

    return creds;
  }

  clearCache(): void {
    this.orgCache.clear();
    this.dcCache.clear();
  }
}
```

- [ ] **Step 3.4: Run tests to verify they pass**

```bash
npm test -- test/unit/auth/auth-manager.test.ts
```

Expected: PASS — all 3 tests green.

- [ ] **Step 3.5: Commit**

```bash
git add src/auth/ test/unit/auth/
git commit -m "feat: add AuthManager with dual org/DC token flow and caching"
```

---

## Task 4: Health Check Tool (Doctor)

**Files:**

- Create: `src/tools/health/doctor.ts`
- Test: `test/unit/tools/health/doctor.test.ts`

- [ ] **Step 4.1: Write failing test**

`test/unit/tools/health/doctor.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { doctorTool } from "../../../src/tools/health/doctor.js";

describe("doctorTool", () => {
  it("returns health status from auth probe", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com",
        username: "chris@hfaloan.com"
      }),
      getDataCloudCredentials: vi.fn().mockResolvedValue({
        accessToken: "dc-token",
        instanceUrl: "https://hfaloan.dc.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({
        searchIndexes: [{ name: "idx1" }, { name: "idx2" }, { name: "idx3" }]
      })
    };

    const result = await doctorTool(
      { target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.status).toBe("ok");
    expect(result.org).toBe("chris@hfaloan.com");
    expect(result.apiVersion).toBe("66.0");
    expect(result.indexes).toBe(3);
    expect(result.instanceUrl).toBe("https://hfaloan.my.salesforce.com");
    expect(result.dataCloudUrl).toBe("https://hfaloan.dc.salesforce.com");
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
npm test -- test/unit/tools/health/doctor.test.ts
```

Expected: FAIL — `doctorTool` not found.

- [ ] **Step 4.3: Implement doctor tool**

`src/tools/health/doctor.ts`:

```typescript
import { z } from "zod";
import type { AuthManager } from "../../auth/auth-manager.js";
import type { DataCloudHttpClient } from "../../util/http.js";

export const doctorInputSchema = z.object({
  target_org: z.string().describe("Salesforce org alias or username")
});

export type DoctorInput = z.infer<typeof doctorInputSchema>;

export interface DoctorResult {
  status: "ok" | "error";
  org: string;
  apiVersion: string;
  indexes: number;
  instanceUrl: string;
  dataCloudUrl: string;
  error?: string;
}

export async function doctorTool(
  input: DoctorInput,
  auth: AuthManager,
  http: DataCloudHttpClient
): Promise<DoctorResult> {
  const orgCreds = await auth.getOrgCredentials(input.target_org);
  const dcCreds = await auth.getDataCloudCredentials(input.target_org);

  const searchIndexes = await http.get<{ searchIndexes: unknown[] }>(
    `${orgCreds.instanceUrl}/services/data/v66.0/ssot/search-indexes`,
    orgCreds.accessToken
  );

  return {
    status: "ok",
    org: orgCreds.username,
    apiVersion: "66.0",
    indexes: searchIndexes.searchIndexes?.length ?? 0,
    instanceUrl: orgCreds.instanceUrl,
    dataCloudUrl: dcCreds.instanceUrl
  };
}
```

- [ ] **Step 4.4: Run test to verify it passes**

```bash
npm test -- test/unit/tools/health/doctor.test.ts
```

Expected: PASS.

- [ ] **Step 4.5: Register tool in index.ts**

Update `src/index.ts` to import and register the doctor tool with the MCP server. This establishes the pattern for all subsequent tools:

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AuthManager } from "./auth/auth-manager.js";
import { DataCloudHttpClient } from "./util/http.js";
import { doctorTool, doctorInputSchema } from "./tools/health/doctor.js";

const server = new McpServer({
  name: "sf-data-cloud-mcp",
  version: "0.1.0"
});

const auth = new AuthManager();
const http = new DataCloudHttpClient();

server.tool(
  "doctor",
  "Check Data Cloud connectivity and health",
  doctorInputSchema.shape,
  async (params) => {
    const result = await doctorTool(params as any, auth, http);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 4.6: Build and verify**

```bash
npm run build
npm test
```

Expected: Build succeeds, all tests pass.

- [ ] **Step 4.7: Commit**

```bash
git add src/ test/unit/tools/health/
git commit -m "feat: add doctor health check tool with MCP registration"
```

---

## Task 5: DMO Tools (7 tools)

**Files:**

- Create: `src/tools/dmo/list-dmos.ts`, `describe-dmo.ts`, `create-dmo.ts`, `create-dmo-from-dlo.ts`, `delete-dmo.ts`, `list-dmo-mappings.ts`, `create-dmo-mapping.ts`
- Test: corresponding test files in `test/unit/tools/dmo/`

Follow the same TDD pattern established in Task 4 for each tool. For each tool:

1. Write test → verify fail → implement → verify pass → register in index.ts
2. All tools take `target_org` as required input
3. Write tools (`create_dmo`, `create_dmo_from_dlo`, `delete_dmo`, `create_dmo_mapping`) require `confirm: true` parameter
4. `create_dmo_from_dlo` uses the type-mapper from Task 7 — stub it for now with a TODO comment and implement the integration after Task 7

**Key implementation details per tool:**

`list-dmos.ts`: GET `/services/data/v66.0/ssot/data-model-objects` → return array of `{ name, label, category, fields, isSegmentable, dataSpace }`

`describe-dmo.ts`: GET `/services/data/v66.0/ssot/data-model-objects/{name}` → return full object with fields array

`create-dmo.ts`: POST `/services/data/v66.0/ssot/data-model-objects` with JSON body from `definition` input. Requires `confirm: true`.

`create-dmo-from-dlo.ts`: Multi-step: describe DLO → build DMO definition with type corrections → create DMO → create mapping. Requires `confirm: true`. Input: `{ target_org, dlo_name, dmo_name?, category?, include_fields?, exclude_fields? }`. This is the smart tool that uses `type-mapper.ts` (Task 7).

`delete-dmo.ts`: DELETE `/services/data/v66.0/ssot/data-model-objects/{name}`. Requires `confirm: true`.

`list-dmo-mappings.ts`: GET `/services/data/v66.0/ssot/data-model-object-mappings?dloDeveloperName={source}&dmoDeveloperName={target}`

`create-dmo-mapping.ts`: POST `/services/data/v66.0/ssot/data-model-object-mappings` with mapping definition. Requires `confirm: true`.

- [ ] **Step 5.1–5.7: Implement each DMO tool using TDD pattern (test → fail → implement → pass)**

One commit per tool, or batch related tools:

```bash
git commit -m "feat: add list_dmos and describe_dmo tools"
git commit -m "feat: add create_dmo and delete_dmo tools"
git commit -m "feat: add DMO mapping tools (list, create)"
git commit -m "feat: add create_dmo_from_dlo smart tool"
```

---

## Task 6: Calculated Insight Tools (5 tools)

**Files:**

- Create: `src/tools/ci/list-calculated-insights.ts`, `create-calculated-insight.ts`, `run-calculated-insight.ts`, `get-calculated-insight-status.ts`, `delete-calculated-insight.ts`
- Test: corresponding test files in `test/unit/tools/ci/`

**Key implementation details:**

`list-calculated-insights.ts`: GET `/services/data/v66.0/ssot/calculated-insights`. Input: `{ target_org, raw?: boolean }`. When `raw: true`, return full definitions including expressions and dimensions.

`create-calculated-insight.ts`: POST `/services/data/v66.0/ssot/calculated-insights`. **Smart behavior:** auto-translate `publishScheduleInterval` values — `"daily"` → `"TwentyFour"`, `"none"` → `"NotScheduled"`, pass PascalCase values through. Auto-add `"definitionType": "CALCULATED_METRIC"` if missing. Requires `confirm: true`.

Translation map for schedule intervals:

```typescript
const SCHEDULE_MAP: Record<string, string> = {
  daily: "TwentyFour",
  "24h": "TwentyFour",
  "12h": "Twelve",
  "6h": "Six",
  "1h": "One",
  none: "NotScheduled",
  off: "NotScheduled",
  // PascalCase passthrough
  TwentyFour: "TwentyFour",
  Twelve: "Twelve",
  Six: "Six",
  One: "One",
  NotScheduled: "NotScheduled"
};
```

`run-calculated-insight.ts`: POST `/services/data/v66.0/ssot/calculated-insights/{name}/actions/run`. Requires `confirm: true`.

`get-calculated-insight-status.ts`: GET `/services/data/v66.0/ssot/calculated-insights` filtered by name, return `{ name, status, lastRunStatus, lastRunDateTime, lastRunErrorCode }`.

`delete-calculated-insight.ts`: DELETE `/services/data/v66.0/ssot/calculated-insights/{name}`. Requires `confirm: true`.

- [ ] **Step 6.1–6.5: Implement each CI tool using TDD pattern**

Commit after each tool or batch:

```bash
git commit -m "feat: add list and get-status calculated insight tools"
git commit -m "feat: add create calculated insight tool with schedule translation"
git commit -m "feat: add run and delete calculated insight tools"
```

---

## Task 7: Smart Layer — Type Mapper and Field Resolver

**Files:**

- Create: `src/smart/type-mapper.ts`, `src/smart/field-resolver.ts`
- Test: `test/unit/smart/type-mapper.test.ts`, `test/unit/smart/field-resolver.test.ts`

- [ ] **Step 7.1: Write failing test for type mapper**

`test/unit/smart/type-mapper.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  correctDmoFieldType,
  cleanDmoFieldName
} from "../../src/smart/type-mapper.js";

describe("correctDmoFieldType", () => {
  it("corrects DATE to Date (not DateTime)", () => {
    expect(correctDmoFieldType("DATE")).toBe("Date");
  });

  it("keeps DECIMAL as Number", () => {
    expect(correctDmoFieldType("DECIMAL")).toBe("Number");
  });

  it("corrects BOOLEAN to Checkbox", () => {
    expect(correctDmoFieldType("BOOLEAN")).toBe("Checkbox");
  });

  it("maps VARCHAR to Text", () => {
    expect(correctDmoFieldType("VARCHAR")).toBe("Text");
  });

  it("maps TIMESTAMP WITH TIME ZONE to DateTime", () => {
    expect(correctDmoFieldType("TIMESTAMP WITH TIME ZONE")).toBe("DateTime");
  });
});

describe("cleanDmoFieldName", () => {
  it("strips redundant _c from custom object fields", () => {
    expect(cleanDmoFieldName("Provider_c__c")).toBe("Provider__c");
  });

  it("strips _c_c__c pattern to _c__c", () => {
    expect(cleanDmoFieldName("Adjusted_Credit_Score_c_c__c")).toBe(
      "Adjusted_Credit_Score_c__c"
    );
  });

  it("leaves system fields unchanged", () => {
    expect(cleanDmoFieldName("DataSource__c")).toBe("DataSource__c");
  });

  it("leaves standard __c fields unchanged", () => {
    expect(cleanDmoFieldName("Name__c")).toBe("Name__c");
  });
});
```

- [ ] **Step 7.2: Run test to verify it fails**

```bash
npm test -- test/unit/smart/type-mapper.test.ts
```

Expected: FAIL.

- [ ] **Step 7.3: Implement type mapper**

`src/smart/type-mapper.ts`:

```typescript
const DLO_TO_DMO_TYPE_MAP: Record<string, string> = {
  VARCHAR: "Text",
  DECIMAL: "Number",
  BOOLEAN: "Checkbox",
  DATE: "Date",
  "TIMESTAMP WITH TIME ZONE": "DateTime",
  INTEGER: "Number",
  BIGINT: "Number"
};

export function correctDmoFieldType(dloType: string): string {
  return DLO_TO_DMO_TYPE_MAP[dloType] ?? "Text";
}

export function cleanDmoFieldName(dloFieldName: string): string {
  // Pattern: custom object fields from CRM get _c__c in DLO, then DMO auto-adds another _c__c
  // e.g., Provider__c (CRM) → Provider_c__c (DLO) → Provider_c_c__c (DMO)
  // We want: Provider_c__c (DLO) → Provider__c (DMO) — strip the intermediate _c
  //
  // Rule: if a field name ends with _c_c__c, collapse to _c__c
  // But also handle: if DLO field ends with _c__c (single custom suffix), the DMO should strip to __c
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

- [ ] **Step 7.4: Run test to verify it passes**

```bash
npm test -- test/unit/smart/type-mapper.test.ts
```

Expected: PASS.

- [ ] **Step 7.5: Write failing test for field resolver**

`test/unit/smart/field-resolver.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { FieldResolver } from "../../src/smart/field-resolver.js";
import dataStreamFixture from "../fixtures/data-stream-list.json";
import dmoMappingFixture from "../fixtures/dmo-mapping-list.json";

describe("FieldResolver", () => {
  it("resolves CRM object to DLO name", async () => {
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ dataStreams: dataStreamFixture })
    };

    const resolver = new FieldResolver(mockHttp as any);
    const dloName = await resolver.resolveDloName(
      "Billing_Account__c",
      "token",
      "https://instance.com"
    );

    expect(dloName).toBe("Billing_Account_c_00Df20000018YWM__dll");
  });

  it("resolves DLO field to DMO field via mapping", async () => {
    const mockHttp = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ dataStreams: dataStreamFixture })
        .mockResolvedValueOnce(dmoMappingFixture)
    };

    const resolver = new FieldResolver(mockHttp as any);
    const mapping = await resolver.resolveFieldMapping(
      "Billing_Account__c",
      "Adjusted_Credit_Score__c",
      "token",
      "https://instance.com"
    );

    expect(mapping.dlo).toBe("Billing_Account_c_00Df20000018YWM__dll");
    expect(mapping.dloField).toBe("Adjusted_Credit_Score_c__c");
    expect(mapping.dmo).toBe("PRA_BillingAccount__dlm");
    expect(mapping.dmoField).toBe("Adjusted_Credit_Score_c_c__c");
  });
});
```

- [ ] **Step 7.6: Implement field resolver**

`src/smart/field-resolver.ts`:

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

    // CRM object Billing_Account__c → DLO name pattern: Billing_Account_c_*__dll
    const crmBase = crmObjectName.replace(/__c$/, "_c").replace(/__/, "_");
    const stream = response.dataStreams.find(
      (s) => s.name.startsWith(crmBase) || s.label.includes(crmObjectName)
    );

    if (!stream) {
      throw new Error(`No data stream found for CRM object: ${crmObjectName}`);
    }

    // DLO name = stream name + __dll suffix
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

    // CRM field Adjusted_Credit_Score__c → DLO field Adjusted_Credit_Score_c__c
    const dloField = crmFieldName.replace(/__c$/, "_c__c");

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
}
```

- [ ] **Step 7.7: Run tests to verify they pass**

```bash
npm test -- test/unit/smart/
```

Expected: PASS.

- [ ] **Step 7.8: Commit**

```bash
git add src/smart/ test/unit/smart/
git commit -m "feat: add smart layer — type mapper and field resolver"
```

---

## Task 8: SQL Translator

**Files:**

- Create: `src/smart/sql-translator.ts`
- Test: `test/unit/smart/sql-translator.test.ts`

- [ ] **Step 8.1: Write failing test**

`test/unit/smart/sql-translator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { translateDloSqlToDmoSql } from "../../src/smart/sql-translator.js";

describe("translateDloSqlToDmoSql", () => {
  it("replaces DLO table references with DMO references", () => {
    const dloSql =
      "SELECT Billing_Account_c_00Df20000018YWM__dll.Provider_c__c FROM Billing_Account_c_00Df20000018YWM__dll";
    const tableMap = {
      Billing_Account_c_00Df20000018YWM__dll: "PRA_BillingAccount__dlm"
    };
    const fieldMap = {
      "Billing_Account_c_00Df20000018YWM__dll.Provider_c__c":
        "PRA_BillingAccount__dlm.Provider_c_c__c"
    };

    const result = translateDloSqlToDmoSql(dloSql, tableMap, fieldMap);

    expect(result).toContain("PRA_BillingAccount__dlm");
    expect(result).toContain("Provider_c_c__c");
    expect(result).not.toContain("__dll");
  });

  it("expands aliases to fully qualified DMO names", () => {
    const dloSql =
      "SELECT ba.Provider_c__c FROM Billing_Account_c_00Df20000018YWM__dll ba";
    const tableMap = {
      Billing_Account_c_00Df20000018YWM__dll: "PRA_BillingAccount__dlm"
    };
    const fieldMap = {
      "Billing_Account_c_00Df20000018YWM__dll.Provider_c__c":
        "PRA_BillingAccount__dlm.Provider_c_c__c"
    };

    const result = translateDloSqlToDmoSql(dloSql, tableMap, fieldMap);

    expect(result).toContain("PRA_BillingAccount__dlm.Provider_c_c__c");
    expect(result).not.toContain("ba.");
  });
});
```

- [ ] **Step 8.2–8.4: Implement, verify pass, commit**

`src/smart/sql-translator.ts`: Parse SQL to identify table references and aliases, then replace using the provided maps. This is a string-based translator, not a full SQL parser — sufficient for the structured SQL patterns Data Cloud uses.

```bash
git commit -m "feat: add SQL translator (DLO→DMO SQL conversion)"
```

---

## Task 9: Query Tools (4 tools)

**Files:**

- Create: `src/tools/query/query-sql.ts`, `describe-table.ts`, `search-vector.ts`, `search-hybrid.ts`
- Test: corresponding test files

**Key details:**

`query-sql.ts`: POST `/services/data/v66.0/ssot/query` with `{ sql: "<query>" }`. Uses **org token** (Connect REST surface). Input: `{ target_org, sql }`.

`describe-table.ts`: Same endpoint, executes `SELECT * FROM {table} LIMIT 0` to get column metadata. Input: `{ target_org, table }`.

`search-vector.ts`: POST `/services/data/v66.0/ssot/search-indexes/{index_name}/vector` with `{ query, limit }`. Input: `{ target_org, index_name, query, limit? }`.

`search-hybrid.ts`: POST `/services/data/v66.0/ssot/search-indexes/{index_name}/hybrid` with `{ query, limit }`. Input: `{ target_org, index_name, query, limit? }`.

- [ ] **Step 9.1–9.4: TDD each tool, commit**

```bash
git commit -m "feat: add query_sql and describe_table tools"
git commit -m "feat: add vector and hybrid search tools"
```

---

## Task 10: Data Stream Tools (3 tools)

Same TDD pattern. GET `/ssot/data-streams` for list, GET `/ssot/data-streams/{name}` for describe, POST `/ssot/data-streams` for create (requires `confirm: true`).

```bash
git commit -m "feat: add data stream list, describe, and create tools"
```

---

## Task 11: Transform Tools (3 tools)

GET `/ssot/data-transforms` for list, GET `/ssot/data-transforms/{name}` for status, POST `/ssot/data-transforms/{name}/actions/run` for run (requires `confirm: true`).

```bash
git commit -m "feat: add transform list, status, and run tools"
```

---

## Task 12: Identity Resolution Tools (2 tools)

GET `/ssot/identity-resolutions` for list, GET `/ssot/identity-resolutions/{name}` for describe.

```bash
git commit -m "feat: add identity resolution list and describe tools"
```

---

## Task 13: Segment Tools (3 tools)

GET `/ssot/segments` for list, GET `/ssot/segments/{name}` for describe, POST `/ssot/segments/{name}/actions/publish` for publish (requires `confirm: true`).

```bash
git commit -m "feat: add segment list, describe, and publish tools"
```

---

## Task 14: Activation and Data Action Tools (4 tools)

GET `/ssot/activations` for list, GET `/ssot/activation-targets` for list targets, POST `/ssot/activations` for create (requires `confirm: true`), GET `/ssot/data-actions` for list.

```bash
git commit -m "feat: add activation, activation target, and data action tools"
```

---

## Task 15: Profile Tool (1 tool)

GET `/api/v1/profile/{profileName}` using **Data Cloud token** auth.

```bash
git commit -m "feat: add unified profile query tool"
```

---

## Task 16: Flex Credit Estimator

**Files:**

- Create: `src/tools/credits/estimate-flex-credits.ts`
- Test: `test/unit/tools/credits/estimate-flex-credits.test.ts`

- [ ] **Step 16.1: Write failing test**

`test/unit/tools/credits/estimate-flex-credits.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { estimateFlexCredits } from "../../../src/tools/credits/estimate-flex-credits.js";

describe("estimateFlexCredits", () => {
  it("estimates credits for PRA daily CI chain", () => {
    const result = estimateFlexCredits({
      mode: "estimate",
      ci_count: 15,
      schedule: "daily",
      avg_records_per_ci: 140000
    });

    expect(result.estimated_daily_credits).toBeGreaterThan(0);
    expect(result.estimated_monthly_credits).toBeGreaterThan(0);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].operation).toBe("Calculated Insight refresh");
  });

  it("combines multiple operation types", () => {
    const result = estimateFlexCredits({
      mode: "estimate",
      ci_count: 15,
      schedule: "daily",
      avg_records_per_ci: 140000,
      stream_count: 5,
      avg_records_per_stream: 100000
    });

    expect(result.breakdown).toHaveLength(2);
  });

  it("queries live usage when mode is live", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://instance.com"
      })
    };
    const mockHttp = {
      post: vi.fn().mockResolvedValue({
        data: [{ Unit_Consumed: 150.5, Drawdown_Day: "2026-04-08" }],
        metadata: { rowCount: 1 }
      })
    };

    const result = await estimateFlexCredits(
      { mode: "live", target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.live_usage).toBeDefined();
    expect(mockHttp.post).toHaveBeenCalled();
  });
});
```

- [ ] **Step 16.2–16.4: Implement with configurable rate table, verify pass, commit**

The rate table should be a const object that can be easily updated:

```typescript
const CREDIT_RATES = {
  ci_refresh_per_1k_rows: 0.25,
  query_per_execution: 0.05,
  stream_ingestion_per_1k_records: 0.1,
  identity_resolution_per_1k_profiles: 0.5,
  segment_publish_per_1k_members: 0.1,
  activation_per_1k_records: 0.15
};
```

```bash
git commit -m "feat: add flex credit estimator with rate table and live usage query"
```

---

## Task 17: Resolve Field Names Tool

**Files:**

- Create: `src/tools/smart/resolve-field-names.ts` (wraps FieldResolver from Task 7 as an MCP tool)
- Test: `test/unit/tools/smart/resolve-field-names.test.ts`

Input: `{ target_org, crm_object, crm_field? }`. Output: `{ crm, dlo, dloField, dmo, dmoField }`.

```bash
git commit -m "feat: add resolve_field_names MCP tool"
```

---

## Task 18: Register All Tools in index.ts and Final Build

- [ ] **Step 18.1: Register all 35 tools in src/index.ts**

Import each tool and register with the MCP server using `server.tool()`. Group registrations by category with comments.

- [ ] **Step 18.2: Run full test suite**

```bash
npm test
```

Expected: All tests pass (should be 80+ tests across 35 tools + smart layer + utils).

- [ ] **Step 18.3: Build**

```bash
npm run build
```

Expected: Clean compilation, no errors.

- [ ] **Step 18.4: Commit**

```bash
git add -A
git commit -m "feat: register all 35 tools, final build passes"
```

---

## Task 19: README and Documentation

- [ ] **Step 19.1: Expand README.md with tool reference**

Add a tool reference table listing all 35 tools with one-line descriptions, grouped by category. Include configuration examples for Claude Code and Claude Desktop.

- [ ] **Step 19.2: Commit**

```bash
git add README.md
git commit -m "docs: add tool reference and configuration examples to README"
```

---

## Task 20: Final Verification

- [ ] **Step 20.1: Full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 20.2: Build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 20.3: Verify binary works**

```bash
node dist/index.js --help 2>&1 || echo "Server started (expected — MCP servers run via stdio)"
```

- [ ] **Step 20.4: Final commit and tag**

```bash
git add -A
git commit -m "chore: final verification — all tests pass, build clean"
git tag v0.1.0
git push origin main --tags
```
