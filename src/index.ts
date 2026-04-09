#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AuthManager } from "./auth/auth-manager.js";
import { DataCloudHttpClient } from "./util/http.js";

// Health
import { doctorTool, doctorInputSchema } from "./tools/health/doctor.js";

// DMO
import { listDmosTool, listDmosInputSchema } from "./tools/dmo/list-dmos.js";
import { describeDmoTool, describeDmoInputSchema } from "./tools/dmo/describe-dmo.js";
import { createDmoTool, createDmoInputSchema } from "./tools/dmo/create-dmo.js";
import { createDmoFromDloTool, createDmoFromDloInputSchema } from "./tools/dmo/create-dmo-from-dlo.js";
import { deleteDmoTool, deleteDmoInputSchema } from "./tools/dmo/delete-dmo.js";
import { listDmoMappingsTool, listDmoMappingsInputSchema } from "./tools/dmo/list-dmo-mappings.js";
import { createDmoMappingTool, createDmoMappingInputSchema } from "./tools/dmo/create-dmo-mapping.js";

// Calculated Insights
import { listCalculatedInsightsTool, listCalculatedInsightsInputSchema } from "./tools/ci/list-calculated-insights.js";
import { createCalculatedInsightTool, createCalculatedInsightInputSchema } from "./tools/ci/create-calculated-insight.js";
import { runCalculatedInsightTool, runCalculatedInsightInputSchema } from "./tools/ci/run-calculated-insight.js";
import { getCalculatedInsightStatusTool, getCalculatedInsightStatusInputSchema } from "./tools/ci/get-calculated-insight-status.js";
import { deleteCalculatedInsightTool, deleteCalculatedInsightInputSchema } from "./tools/ci/delete-calculated-insight.js";

// Query
import { querySqlTool, querySqlInputSchema } from "./tools/query/query-sql.js";
import { describeTableTool, describeTableInputSchema } from "./tools/query/describe-table.js";
import { searchVectorTool, searchVectorInputSchema } from "./tools/query/search-vector.js";
import { searchHybridTool, searchHybridInputSchema } from "./tools/query/search-hybrid.js";

// Data Streams
import { listDataStreamsTool, listDataStreamsInputSchema } from "./tools/stream/list-data-streams.js";
import { describeDataStreamTool, describeDataStreamInputSchema } from "./tools/stream/describe-data-stream.js";
import { createDataStreamTool, createDataStreamInputSchema } from "./tools/stream/create-data-stream.js";

// Transforms
import { listTransformsTool, listTransformsInputSchema } from "./tools/transform/list-transforms.js";
import { runTransformTool, runTransformInputSchema } from "./tools/transform/run-transform.js";
import { getTransformStatusTool, getTransformStatusInputSchema } from "./tools/transform/get-transform-status.js";

// Identity Resolution
import { listIdentityResolutionsTool, listIdentityResolutionsInputSchema } from "./tools/identity/list-identity-resolutions.js";
import { describeIdentityResolutionTool, describeIdentityResolutionInputSchema } from "./tools/identity/describe-identity-resolution.js";

// Segments
import { listSegmentsTool, listSegmentsInputSchema } from "./tools/segment/list-segments.js";
import { describeSegmentTool, describeSegmentInputSchema } from "./tools/segment/describe-segment.js";
import { publishSegmentTool, publishSegmentInputSchema } from "./tools/segment/publish-segment.js";

// Activations
import { listActivationsTool, listActivationsInputSchema } from "./tools/activation/list-activations.js";
import { listActivationTargetsTool, listActivationTargetsInputSchema } from "./tools/activation/list-activation-targets.js";
import { createActivationTool, createActivationInputSchema } from "./tools/activation/create-activation.js";

// Data Actions
import { listDataActionsTool, listDataActionsInputSchema } from "./tools/action/list-data-actions.js";

// Profile
import { queryProfileTool, queryProfileInputSchema } from "./tools/profile/query-profile.js";

// Credits
import { estimateFlexCredits, estimateFlexCreditsInputSchema } from "./tools/credits/estimate-flex-credits.js";

// Smart
import { resolveFieldNamesTool, resolveFieldNamesInputSchema } from "./tools/smart/resolve-field-names.js";

const server = new McpServer({
  name: "sf-data-cloud-mcp",
  version: "0.1.0"
});

const auth = new AuthManager();
const http = new DataCloudHttpClient();

function toolResult(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
  };
}

// Health
server.tool("doctor", "Check Data Cloud connectivity and health", doctorInputSchema.shape, async (params) => {
  return toolResult(await doctorTool(params as any, auth, http));
});

// DMO tools
server.tool("list_dmos", "List all Data Model Objects", listDmosInputSchema.shape, async (params) => {
  return toolResult(await listDmosTool(params as any, auth, http));
});

server.tool("describe_dmo", "Describe a DMO with its fields", describeDmoInputSchema.shape, async (params) => {
  return toolResult(await describeDmoTool(params as any, auth, http));
});

server.tool("create_dmo", "Create a new Data Model Object", createDmoInputSchema.shape, async (params) => {
  return toolResult(await createDmoTool(params as any, auth, http));
});

server.tool("create_dmo_from_dlo", "Create DMO from DLO with auto type correction and mapping", createDmoFromDloInputSchema.shape, async (params) => {
  return toolResult(await createDmoFromDloTool(params as any, auth, http));
});

server.tool("delete_dmo", "Delete a Data Model Object", deleteDmoInputSchema.shape, async (params) => {
  return toolResult(await deleteDmoTool(params as any, auth, http));
});

server.tool("list_dmo_mappings", "List field mappings between DLO and DMO", listDmoMappingsInputSchema.shape, async (params) => {
  return toolResult(await listDmoMappingsTool(params as any, auth, http));
});

server.tool("create_dmo_mapping", "Create field mapping between DLO and DMO", createDmoMappingInputSchema.shape, async (params) => {
  return toolResult(await createDmoMappingTool(params as any, auth, http));
});

// Calculated Insight tools
server.tool("list_calculated_insights", "List all Calculated Insights", listCalculatedInsightsInputSchema.shape, async (params) => {
  return toolResult(await listCalculatedInsightsTool(params as any, auth, http));
});

server.tool("create_calculated_insight", "Create a Calculated Insight with smart schedule translation", createCalculatedInsightInputSchema.shape, async (params) => {
  return toolResult(await createCalculatedInsightTool(params as any, auth, http));
});

server.tool("run_calculated_insight", "Trigger a Calculated Insight run", runCalculatedInsightInputSchema.shape, async (params) => {
  return toolResult(await runCalculatedInsightTool(params as any, auth, http));
});

server.tool("get_calculated_insight_status", "Get status of a Calculated Insight", getCalculatedInsightStatusInputSchema.shape, async (params) => {
  return toolResult(await getCalculatedInsightStatusTool(params as any, auth, http));
});

server.tool("delete_calculated_insight", "Delete a Calculated Insight", deleteCalculatedInsightInputSchema.shape, async (params) => {
  return toolResult(await deleteCalculatedInsightTool(params as any, auth, http));
});

// Query tools
server.tool("query_sql", "Execute SQL query against Data Cloud", querySqlInputSchema.shape, async (params) => {
  return toolResult(await querySqlTool(params as any, auth, http));
});

server.tool("describe_table", "Describe table columns via LIMIT 0 query", describeTableInputSchema.shape, async (params) => {
  return toolResult(await describeTableTool(params as any, auth, http));
});

server.tool("search_vector", "Vector similarity search on a search index", searchVectorInputSchema.shape, async (params) => {
  return toolResult(await searchVectorTool(params as any, auth, http));
});

server.tool("search_hybrid", "Hybrid keyword+vector search on a search index", searchHybridInputSchema.shape, async (params) => {
  return toolResult(await searchHybridTool(params as any, auth, http));
});

// Data Stream tools
server.tool("list_data_streams", "List all data streams", listDataStreamsInputSchema.shape, async (params) => {
  return toolResult(await listDataStreamsTool(params as any, auth, http));
});

server.tool("describe_data_stream", "Describe a data stream", describeDataStreamInputSchema.shape, async (params) => {
  return toolResult(await describeDataStreamTool(params as any, auth, http));
});

server.tool("create_data_stream", "Create a new data stream", createDataStreamInputSchema.shape, async (params) => {
  return toolResult(await createDataStreamTool(params as any, auth, http));
});

// Transform tools
server.tool("list_transforms", "List all data transforms", listTransformsInputSchema.shape, async (params) => {
  return toolResult(await listTransformsTool(params as any, auth, http));
});

server.tool("run_transform", "Run a data transform", runTransformInputSchema.shape, async (params) => {
  return toolResult(await runTransformTool(params as any, auth, http));
});

server.tool("get_transform_status", "Get status of a data transform", getTransformStatusInputSchema.shape, async (params) => {
  return toolResult(await getTransformStatusTool(params as any, auth, http));
});

// Identity Resolution tools
server.tool("list_identity_resolutions", "List all identity resolution rulesets", listIdentityResolutionsInputSchema.shape, async (params) => {
  return toolResult(await listIdentityResolutionsTool(params as any, auth, http));
});

server.tool("describe_identity_resolution", "Describe an identity resolution ruleset", describeIdentityResolutionInputSchema.shape, async (params) => {
  return toolResult(await describeIdentityResolutionTool(params as any, auth, http));
});

// Segment tools
server.tool("list_segments", "List all segments", listSegmentsInputSchema.shape, async (params) => {
  return toolResult(await listSegmentsTool(params as any, auth, http));
});

server.tool("describe_segment", "Describe a segment", describeSegmentInputSchema.shape, async (params) => {
  return toolResult(await describeSegmentTool(params as any, auth, http));
});

server.tool("publish_segment", "Publish a segment", publishSegmentInputSchema.shape, async (params) => {
  return toolResult(await publishSegmentTool(params as any, auth, http));
});

// Activation tools
server.tool("list_activations", "List all activations", listActivationsInputSchema.shape, async (params) => {
  return toolResult(await listActivationsTool(params as any, auth, http));
});

server.tool("list_activation_targets", "List all activation targets", listActivationTargetsInputSchema.shape, async (params) => {
  return toolResult(await listActivationTargetsTool(params as any, auth, http));
});

server.tool("create_activation", "Create a new activation", createActivationInputSchema.shape, async (params) => {
  return toolResult(await createActivationTool(params as any, auth, http));
});

// Data Action tools
server.tool("list_data_actions", "List all data actions", listDataActionsInputSchema.shape, async (params) => {
  return toolResult(await listDataActionsTool(params as any, auth, http));
});

// Profile tools
server.tool("query_profile", "Query unified profiles using Data Cloud token", queryProfileInputSchema.shape, async (params) => {
  return toolResult(await queryProfileTool(params as any, auth, http));
});

// Credit tools
server.tool("estimate_flex_credits", "Estimate or query live flex credit usage", estimateFlexCreditsInputSchema.shape, async (params) => {
  return toolResult(await estimateFlexCredits(params as any, auth, http));
});

// Smart tools
server.tool("resolve_field_names", "Resolve CRM object/field names to DLO/DMO names", resolveFieldNamesInputSchema.shape, async (params) => {
  return toolResult(await resolveFieldNamesTool(params as any, auth, http));
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
