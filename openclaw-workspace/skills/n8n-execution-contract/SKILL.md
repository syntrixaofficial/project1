---
name: n8n-execution-contract
description: Define and validate structured n8n request candidates that OpenClaw sends to n8n for all external execution.
---

# n8n Execution Contract Skill

Use this skill when creating or reviewing execution requests from OpenClaw to n8n.

## Rule

OpenClaw never executes external actions directly.

Every external action, retrieval, persistence, delivery, handoff, escalation, or infrastructure operation must be expressed as a structured n8n request candidate.

## Intent Shape

```json
{
  "id": "<uuid>",
  "type": "workflow_request",
  "workflow": "<allowlisted_workflow_name>",
  "priority": "low|normal|high|urgent",
  "payload": {},
  "requester": {
    "id": "<agent-id>",
    "role": "agent|supervisor"
  },
  "timestamp": "<ISO8601>",
  "version": "1.0"
}
```

## n8n Gateway

The imported n8n workflow uses one OpenClaw intent gateway:

- webhook path: `/webhook/openclaw/intent`
- webhook node: `UTIL001 core.intent.gateway`

Do not create per-agent HTTP endpoints.

Allowed request `type` values:

- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `human_intervention`
- `handoff`

Supported workflow categories:

- contact
- lead
- research
- helpdesk
- marketing
- health
- communication
- memory
- escalation
- infrastructure

## Required Fields

- `id`: unique request id
- `type`: allowed request type
- `workflow`: explicit allowlisted n8n workflow identifier when `type` is `workflow_request`
- `priority`: `low`, `normal`, `high`, or `urgent`
- `payload`: request-specific data object
- `requester`: known requester identity and role
- `timestamp`: ISO8601 creation time
- `version`: contract version

## Validation

Before sending to n8n, verify:

- the workflow is allowed
- requester identity and role are authorized
- the payload is minimal and workflow-specific
- the payload contains no raw secrets or credentials
- payload does not contain executable code or shell commands
- the requested action belongs to n8n
- the intent is auditable
- irreversible actions have explicit human confirmation

OpenClaw must not directly retrieve context from databases, memory stores, identity stores, knowledge stores, monitoring systems, Docker, VPS infrastructure, analytics providers, or external APIs.
