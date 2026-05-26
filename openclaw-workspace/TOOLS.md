# Syntrixa Execution Contract

Purpose: runtime tool and execution boundary for `syntra` and OpenClaw agents.

OpenClaw reasons.

n8n executes.

OpenClaw does not own direct external tools.

## Boundary

OpenClaw must not directly:

- call external service APIs
- authenticate third-party services
- send email or external messages
- mutate external systems
- run n8n workflow logic internally
- bypass n8n through direct tool use
- access databases, memory stores, knowledge stores, workflow persistence, identity stores, monitoring, Docker, VPS, or analytics providers

n8n owns:

- API calls
- service authentication
- email sending
- external mutations
- external retries
- external automation reliability
- database access
- memory retrieval and persistence
- knowledge retrieval
- identity retrieval
- workflow and lifecycle persistence
- monitoring, observability, and infrastructure actions

## Internal Capabilities

OpenClaw may use internal capabilities for:

- reasoning
- routing
- supplied context interpretation
- specialist agent selection
- structured output generation
- request validation
- communication mediation
- health classification
- escalation preparation

Internal capabilities must not become hidden external execution.

## Context, Memory, And Storage Boundary

Memory, identity, knowledge, workflow state, and lifecycle state are not direct OpenClaw capabilities.

Agents must not directly read or write:

- Postgres
- Redis
- Vector DB
- filesystem memory stores
- knowledge stores
- identity stores
- workflow persistence stores

Allowed flow:

```text
n8n gathers context -> n8n packages context -> OpenClaw reasons
OpenClaw request candidate -> n8n Intent Gateway -> n8n workflow -> external system/storage
```

Storage ownership:

- Postgres: durable memory, identity context, private/shared memory metadata, audit records.
- Redis: short-lived working/session state only.
- Vector DB: sanitized semantic references only.

Agents use packaged context and record references such as `lead_id`, `account_id`, `contact_id`, `trace_id`, or `memory_ref`. They do not hardcode database clients, connection strings, SQL, credentials, vector queries, retrieval APIs, or storage logic.

## Workflow Intent

All external action requests must become a `workflow_request` intent.

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

## Validation

Before sending or approving an intent, `syntra` verifies:

- `type` is `workflow_request`
- `workflow` is explicit and allowlisted
- `priority` is valid
- `requester.id` is known
- `requester.role` is authorized for the workflow
- `payload` is minimal and workflow-specific
- `payload` contains no raw secrets or credentials
- `payload` does not contain executable code or shell commands
- expected result is clear
- irreversible actions have explicit human confirmation

## Secret Handling

Secrets must not appear in:

- markdown files
- JSON config
- prompts
- logs
- workflow payloads
- memory

Use environment-backed secret references only.

Allowed pattern:

```json
{
  "secret_ref": "EMAIL_PROVIDER_API_KEY"
}
```

Disallowed pattern:

```json
{
  "api_key": "raw_secret_value"
}
```

## Transport

OpenClaw-to-n8n communication uses REST/webhooks.

Default internal n8n address:

```text
http://n8n:5678
```

Default webhook path:

```text
/webhook/openclaw/intent
```

Redis queues are intentionally not part of the OpenClaw-to-n8n contract.

## n8n Intent Gateway

The current n8n workflow import (`n8n.json`) exposes one OpenClaw entrypoint:

- webhook node: `UTIL001 core.intent.gateway`
- method: `POST`
- path: `openclaw/intent`
- runtime URL path: `/webhook/openclaw/intent`

There are no per-agent HTTP endpoints. All agent requests enter the same gateway and are routed by `type`, then by `workflow` when `type` is `workflow_request`.

Allowed top-level request types:

- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `human_intervention`
- `handoff`

Supported request categories:

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

Allowed `workflow_request.workflow` values are owned by n8n allowlists and must map to one of the supported categories.

All OpenClaw callable agent interfaces should be invoked by n8n through the same gateway or through the approved n8n OpenClaw invocation workflow. There are no direct per-agent external integrations.

Supported communication channels in the n8n router:

- `email`
- `desktop`
- `slack`
- `discord`

## Communication Channels

Agents request communication abstractly.

Supported logical channels:

- email
- desktop
- dashboard
- alerts
- future slack/discord

Agents do not hardcode transport.

External communication requires an n8n `communication_request` or approved workflow request through the intent gateway.

## Failure Handling

If execution fails or is unsafe:

- do not retry directly from OpenClaw
- route failure context to Health Monitoring Agent
- preserve sanitized trace id and validation result
- propose retry metadata only if needed
- let n8n own external retry execution
