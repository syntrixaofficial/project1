# P3 Custom Dashboard Data Contract

Purpose: define safe OpenClaw-derived fields that may be exposed later to P3's custom Syntrixa dashboard.

P3 is building a separate custom operational dashboard, not using the OpenClaw/NemoClaw dashboard.

P3 may later provide dashboard APIs, storage models, Kanban views, analytics views, and visual workflows. This document only defines which OpenClaw-derived fields are safe for n8n/P3 to expose.

The custom dashboard must not call OpenClaw directly. It should consume sanitized data from APIs/storage owned by P2/P3 after n8n processes OpenClaw results.

## Safe Display Fields

From `agent_result`:

- `agent`
- `event_type`
- `classification`
- `confidence`
- `summary`
- `context_package_used.package_id`
- `context_package_used.source_workflow`
- `facts`
- `inferences`
- `unknowns`
- `missing_fields`
- `recommended_next_steps`
- `handoff.ready`
- `handoff.target_agent`
- `handoff.reason`

From request candidates:

- `id`
- `type`
- `category`
- `priority`
- `requester.id`
- `requester.role`
- `timestamp`
- `version`
- `workflow`
- `target_agent`
- `purpose`
- `required_scopes`
- `decision_needed`

From n8n/P3 API metadata:

- workflow id
- execution id
- trace id
- delivery status
- retry count
- sanitized validation errors

## Do Not Display

Do not display raw secrets, auth headers, API keys, raw email/chat bodies unless separately approved and sanitized by n8n, raw logs, raw form payloads, database connection strings, model provider keys, or private memory content without n8n authorization.

## Possible Custom Dashboard Views

- lead qualification Kanban
- agent task/status board
- request candidate queue
- handoff pipeline
- context request backlog
- human intervention queue
- workflow execution timeline
- confidence/classification charts
- health incident board
- marketing recommendation history
- research report list
- communication delivery status

## Integration Rule

P3 should read from P2/P3-provided APIs or dashboard storage, not directly from OpenClaw files, OpenClaw runtime, or the OpenClaw/NemoClaw UI.

n8n owns persistence and determines what dashboard-safe data is stored.

OpenClaw only supplies reasoning results and request candidates through n8n.
