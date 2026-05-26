# Syntrixa Execution Contract

OpenClaw reasons. n8n executes.

The current P2 n8n workflow contract is `newn8n.json`.

## Boundary

OpenClaw must never directly:

- call APIs
- authenticate services
- send email/chat/alerts/SMS/tickets
- mutate external systems
- read/write Postgres, MongoDB, Redis, files, identity, knowledge, workflow, monitoring, Docker, or VPS infra
- run n8n logic internally
- bypass n8n

n8n owns credentials, API calls, delivery, storage, memory, identity, workflow state, observability, retries, and infra actions.

## OpenClaw Capabilities

OpenClaw may only:

- reason
- route
- interpret supplied context
- select specialists
- generate structured outputs
- validate request candidates
- mediate communication
- classify health incidents
- prepare escalation

## n8n Gateway

Entrypoint:

- `POST /webhook/openclaw/intent`
- latest workflow file: `newn8n.json`
- n8n node: `UTIL001 Normalize Gateway Envelope`

Validate outputs against `schemas/request-candidate.schema.json`.

Allowed request types:

- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `handoff`
- `human_intervention`

Allowed categories:

- contact, lead, research, helpdesk, marketing, health, communication, memory, escalation, infrastructure

## Request Shape

All requests must include:

- id
- type
- category
- priority
- requester
- timestamp
- version

`version` must be `"1.0"` for the current P2 n8n contract.

## Validation

`syntra` checks that the request:

- uses allowed type/category
- has an authorized requester
- has minimal, purpose-specific payloads
- contains no secrets, credentials, code, or shell commands
- does not claim execution without n8n
- requires human confirmation for sensitive operations

## Secrets

No secrets in markdown, JSON, prompts, logs, workflows, memory, or context.

Use only environment-backed secret refs.

## Storage Boundary

n8n owns storage.

OpenClaw only reasons over packaged context or emits `context_request` / `memory_update`.

## Communication

Agents may request abstract communication: purpose, recipient, channel hint, template hint, content, questions, urgency.

n8n selects channel, resolves creds, sends, logs, retries.
