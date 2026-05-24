---
name: n8n-execution-contract
description: Define and validate structured workflow intents that OpenClaw sends to n8n for all external execution.
---

# n8n Execution Contract Skill

Use this skill when creating or reviewing execution requests from OpenClaw to n8n.

## Rule

OpenClaw never executes external actions directly.

Every external action must be expressed as a structured intent.

## Intent Shape

```json
{
  "type": "workflow_request",
  "workflow": "send_email",
  "priority": "normal",
  "payload": {}
}
```

## Required Fields

- `type`: must be `workflow_request`
- `workflow`: n8n workflow identifier
- `priority`: `low`, `normal`, `high`, or `urgent`
- `payload`: workflow-specific data object

## Validation

Before sending to n8n, verify:

- the workflow is allowed
- the payload contains no unsupported secrets
- the requested action belongs to n8n
- the intent is auditable

