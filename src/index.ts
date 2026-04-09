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

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true as const
  };
}

function safeTool(fn: (params: any) => Promise<unknown>) {
  return async (params: any) => {
    try {
      return toolResult(await fn(params));
    } catch (e) {
      return toolError(e);
    }
  };
}

// Health
server.tool("doctor", "Check Data Cloud connectivity and health", doctorInputSchema.shape,
  safeTool((p) => doctorTool(p, auth, http)));

// DMO tools
server.tool("list_dmos", "List all Data Model Objects", listDmosInputSchema.shape,
  safeTool((p) => listDmosTool(p, auth, http)));

server.tool("describe_dmo", "Describe a DMO with its fields", describeDmoInputSchema.shape,
  safeTool((p) => describeDmoTool(p, auth, http)));

server.tool("create_dmo", "Create a new Data Model Object", createDmoInputSchema.shape,
  safeTool((p) => createDmoTool(p, auth, http)));

server.tool("create_dmo_from_dlo", "Create DMO from DLO with auto type correction and mapping", createDmoFromDloInputSchema.shape,
  safeTool((p) => createDmoFromDloTool(p, auth, http)));

server.tool("delete_dmo", "Delete a Data Model Object", deleteDmoInputSchema.shape,
  safeTool((p) => deleteDmoTool(p, auth, http)));

server.tool("list_dmo_mappings", "List field mappings between DLO and DMO", listDmoMappingsInputSchema.shape,
  safeTool((p) => listDmoMappingsTool(p, auth, http)));

server.tool("create_dmo_mapping", "Create field mapping between DLO and DMO", createDmoMappingInputSchema.shape,
  safeTool((p) => createDmoMappingTool(p, auth, http)));

// Calculated Insight tools
server.tool("list_calculated_insights", "List all Calculated Insights", listCalculatedInsightsInputSchema.shape,
  safeTool((p) => listCalculatedInsightsTool(p, auth, http)));

server.tool("create_calculated_insight", "Create a Calculated Insight with smart schedule translation", createCalculatedInsightInputSchema.shape,
  safeTool((p) => createCalculatedInsightTool(p, auth, http)));

server.tool("run_calculated_insight", "Trigger a Calculated Insight run", runCalculatedInsightInputSchema.shape,
  safeTool((p) => runCalculatedInsightTool(p, auth, http)));

server.tool("get_calculated_insight_status", "Get status of a Calculated Insight", getCalculatedInsightStatusInputSchema.shape,
  safeTool((p) => getCalculatedInsightStatusTool(p, auth, http)));

server.tool("delete_calculated_insight", "Delete a Calculated Insight", deleteCalculatedInsightInputSchema.shape,
  safeTool((p) => deleteCalculatedInsightTool(p, auth, http)));

// Query tools
server.tool("query_sql", "Execute SQL query against Data Cloud", querySqlInputSchema.shape,
  safeTool((p) => querySqlTool(p, auth, http)));

server.tool("describe_table", "Describe table columns via LIMIT 0 query", describeTableInputSchema.shape,
  safeTool((p) => describeTableTool(p, auth, http)));

server.tool("search_vector", "Vector similarity search on a search index", searchVectorInputSchema.shape,
  safeTool((p) => searchVectorTool(p, auth, http)));

server.tool("search_hybrid", "Hybrid keyword+vector search on a search index", searchHybridInputSchema.shape,
  safeTool((p) => searchHybridTool(p, auth, http)));

// Data Stream tools
server.tool("list_data_streams", "List all data streams", listDataStreamsInputSchema.shape,
  safeTool((p) => listDataStreamsTool(p, auth, http)));

server.tool("describe_data_stream", "Describe a data stream", describeDataStreamInputSchema.shape,
  safeTool((p) => describeDataStreamTool(p, auth, http)));

server.tool("create_data_stream", "Create a new data stream", createDataStreamInputSchema.shape,
  safeTool((p) => createDataStreamTool(p, auth, http)));

// Transform tools
server.tool("list_transforms", "List all data transforms", listTransformsInputSchema.shape,
  safeTool((p) => listTransformsTool(p, auth, http)));

server.tool("run_transform", "Run a data transform", runTransformInputSchema.shape,
  safeTool((p) => runTransformTool(p, auth, http)));

server.tool("get_transform_status", "Get status of a data transform", getTransformStatusInputSchema.shape,
  safeTool((p) => getTransformStatusTool(p, auth, http)));

// Identity Resolution tools
server.tool("list_identity_resolutions", "List all identity resolution rulesets", listIdentityResolutionsInputSchema.shape,
  safeTool((p) => listIdentityResolutionsTool(p, auth, http)));

server.tool("describe_identity_resolution", "Describe an identity resolution ruleset", describeIdentityResolutionInputSchema.shape,
  safeTool((p) => describeIdentityResolutionTool(p, auth, http)));

// Segment tools
server.tool("list_segments", "List all segments", listSegmentsInputSchema.shape,
  safeTool((p) => listSegmentsTool(p, auth, http)));

server.tool("describe_segment", "Describe a segment", describeSegmentInputSchema.shape,
  safeTool((p) => describeSegmentTool(p, auth, http)));

server.tool("publish_segment", "Publish a segment", publishSegmentInputSchema.shape,
  safeTool((p) => publishSegmentTool(p, auth, http)));

// Activation tools
server.tool("list_activations", "List all activations", listActivationsInputSchema.shape,
  safeTool((p) => listActivationsTool(p, auth, http)));

server.tool("list_activation_targets", "List all activation targets", listActivationTargetsInputSchema.shape,
  safeTool((p) => listActivationTargetsTool(p, auth, http)));

server.tool("create_activation", "Create a new activation", createActivationInputSchema.shape,
  safeTool((p) => createActivationTool(p, auth, http)));

// Data Action tools
server.tool("list_data_actions", "List all data actions", listDataActionsInputSchema.shape,
  safeTool((p) => listDataActionsTool(p, auth, http)));

// Profile tools
server.tool("query_profile", "Query unified profiles using Data Cloud token", queryProfileInputSchema.shape,
  safeTool((p) => queryProfileTool(p, auth, http)));

// Credit tools
server.tool("estimate_flex_credits", "Estimate or query live flex credit usage", estimateFlexCreditsInputSchema.shape,
  safeTool((p) => estimateFlexCredits(p, auth, http)));

// Smart tools
server.tool("resolve_field_names", "Resolve CRM object/field names to DLO/DMO names", resolveFieldNamesInputSchema.shape,
  safeTool((p) => resolveFieldNamesTool(p, auth, http)));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
