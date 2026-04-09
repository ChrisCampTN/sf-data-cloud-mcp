# @chriscamp/sf-data-cloud-mcp

MCP server for Salesforce Data Cloud operations. Provides 35 tools covering DMOs, calculated insights, transforms, data streams, queries, segments, activations, profiles, and health checks with a smart enhancement layer.

## Installation

```bash
npx -y @chriscamp/sf-data-cloud-mcp@latest --orgs ALLOW_ALL_ORGS
```

## Prerequisites

- Node.js 18+
- Salesforce CLI (`sf`) with authenticated org
- Data Cloud enabled on the target org

## Configuration

### Claude Code

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "sf-data-cloud": {
      "command": "npx",
      "args": ["-y", "@chriscamp/sf-data-cloud-mcp@latest"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sf-data-cloud": {
      "command": "npx",
      "args": ["-y", "@chriscamp/sf-data-cloud-mcp@latest"]
    }
  }
}
```

## Tools Reference

All tools require a `target_org` parameter (Salesforce org alias or username). Write operations require `confirm: true` to execute (omit for preview).

### Health

| Tool | Description |
|------|-------------|
| `doctor` | Check Data Cloud connectivity and health |

### DMO (Data Model Objects)

| Tool | Description |
|------|-------------|
| `list_dmos` | List all Data Model Objects |
| `describe_dmo` | Describe a DMO with its fields |
| `create_dmo` | Create a new DMO |
| `create_dmo_from_dlo` | Create DMO from DLO with auto type correction and mapping |
| `delete_dmo` | Delete a DMO |
| `list_dmo_mappings` | List field mappings between DLO and DMO |
| `create_dmo_mapping` | Create field mapping between DLO and DMO |

### Calculated Insights

| Tool | Description |
|------|-------------|
| `list_calculated_insights` | List all Calculated Insights |
| `create_calculated_insight` | Create a CI with smart schedule translation |
| `run_calculated_insight` | Trigger a CI run |
| `get_calculated_insight_status` | Get status of a CI |
| `delete_calculated_insight` | Delete a CI |

### Query

| Tool | Description |
|------|-------------|
| `query_sql` | Execute SQL query against Data Cloud |
| `describe_table` | Describe table columns |
| `search_vector` | Vector similarity search |
| `search_hybrid` | Hybrid keyword+vector search |

### Data Streams

| Tool | Description |
|------|-------------|
| `list_data_streams` | List all data streams |
| `describe_data_stream` | Describe a data stream |
| `create_data_stream` | Create a new data stream |

### Transforms

| Tool | Description |
|------|-------------|
| `list_transforms` | List all data transforms |
| `run_transform` | Run a data transform |
| `get_transform_status` | Get status of a transform |

### Identity Resolution

| Tool | Description |
|------|-------------|
| `list_identity_resolutions` | List identity resolution rulesets |
| `describe_identity_resolution` | Describe an identity resolution ruleset |

### Segments

| Tool | Description |
|------|-------------|
| `list_segments` | List all segments |
| `describe_segment` | Describe a segment |
| `publish_segment` | Publish a segment |

### Activations & Actions

| Tool | Description |
|------|-------------|
| `list_activations` | List all activations |
| `list_activation_targets` | List activation targets |
| `create_activation` | Create a new activation |
| `list_data_actions` | List all data actions |

### Profile

| Tool | Description |
|------|-------------|
| `query_profile` | Query unified profiles |

### Credits

| Tool | Description |
|------|-------------|
| `estimate_flex_credits` | Estimate or query live flex credit usage |

### Smart

| Tool | Description |
|------|-------------|
| `resolve_field_names` | Resolve CRM object/field names to DLO/DMO names |

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
