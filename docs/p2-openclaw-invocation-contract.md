# P2 OpenClaw Invocation Contract

Purpose: define how n8n invokes OpenClaw without giving OpenClaw execution authority.

## Endpoint

Inside Docker:

```text
POST http://nemoclaw:8990/openclaw/agent/invoke
```

Environment override used by `newn8n.json`:

```text
OPENCLAW_AGENT_INVOKE_URL
```

Current fallback in `newn8n.json`:

```text
http://nemoclaw:8990/openclaw/agent/invoke
```

Health check:

```text
GET http://nemoclaw:8990/openclaw/health
```

## Authentication

If `OPENCLAW_GATEWAY_TOKEN` is configured with a real value, n8n should send:

```text
Authorization: Bearer <OPENCLAW_GATEWAY_TOKEN>
```

Do not put tokens in workflow JSON. Load them from n8n credentials or environment variables.

## Request Body

```json
{
  "target_agent": "lead-qualification-agent",
  "event_type": "lead_form_submission",
  "priority": "normal",
  "context_package": {
    "package_id": "uuid-from-n8n",
    "source_workflow": "n8n_contact_intake",
    "subject_refs": {
      "lead_id": "lead_123",
      "contact_id": "contact_123",
      "workflow_id": "wf_123",
      "trace_id": "trace_123"
    },
    "constraints": {
      "minimal_context": true,
      "no_raw_secrets": true
    }
  }
}
```

Supported `target_agent` values:

- `syntra`
- `lead-qualification-agent`
- `research-agent`
- `helpdesk-agent`
- `marketing-sales-agent`
- `health-monitoring-agent`

## Response Body

```json
{
  "ok": true,
  "result": {
    "type": "agent_result",
    "agent": "lead-qualification-agent",
    "event_type": "lead_form_submission",
    "classification": "continue_dialogue",
    "confidence": "medium",
    "context_package_used": {
      "package_id": "uuid-from-n8n",
      "source_workflow": "n8n_contact_intake"
    },
    "n8n_request_candidates": []
  }
}
```

Every request candidate uses `version: "1.0"` and must match `openclaw-workspace/schemas/request-candidate.schema.json`.

## n8n Responsibilities

n8n owns external APIs, credentials, database reads/writes, memory retrieval/storage, knowledge retrieval, communication delivery, workflow persistence, retries, monitoring, and target agent invocation.

OpenClaw only receives packaged context and returns reasoning results plus request candidates.

## Error Shape

```json
{
  "ok": false,
  "errors": ["context_package.constraints.no_raw_secrets must be true"]
}
```

Recommended n8n handling:

- `400`: malformed request; stop and log sanitized error
- `401`: auth misconfiguration; alert P2
- `422`: context package contract issue; repair workflow packaging
- `500`: OpenClaw adapter/result validation failure; escalate to P1

## Current Runtime Status

`agent-invoke-server.mjs` is a contract adapter. It gives P2 a stable endpoint now and keeps the same response shape that the real OpenClaw reasoning backend must return later.

## Dashboard Publication

The n8n workflow now publishes dashboard-safe telemetry to the custom dashboard backend:

```text
DASHBOARD_API_EVENT_URL=http://dashboard-api:8080/api/n8n/events
DASHBOARD_API_CANDIDATE_URL=http://dashboard-api:8080/api/n8n/request-candidates
```

These endpoints receive sanitized events and request candidates only. They do not grant the dashboard direct execution ownership.
