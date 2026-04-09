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
