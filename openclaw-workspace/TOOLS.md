# OpenClaw Tools And Execution Notes

## Execution Boundary

OpenClaw does not own direct external tools.

n8n owns:

- API calls
- service authentication
- email sending
- external mutations
- automation reliability
- retries against external services

## OpenClaw-Owned Internal Capabilities

OpenClaw may use internal capabilities for:

- routing
- reasoning
- memory retrieval
- identity context retrieval
- specialist agent selection
- structured output generation
- intent validation
- communication mediation
- health classification

## n8n Contract

OpenClaw emits workflow intents:

```json
{
  "type": "workflow_request",
  "workflow": "send_email",
  "priority": "normal",
  "payload": {}
}
```

The execution connector sends intents to n8n via REST/webhook.

Redis queues are intentionally not part of the OpenClaw-to-n8n contract.

