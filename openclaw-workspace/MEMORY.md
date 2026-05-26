# Syntrixa Memory And Context Contract

Purpose: define how OpenClaw reasons over memory, identity, workflow state, and knowledge without directly accessing any store.

Prime rule:

OpenClaw does not retrieve, persist, index, query, or mutate memory directly.

n8n owns memory workflows, storage workflows, identity retrieval, knowledge retrieval, workflow persistence, and context packaging.

## Runtime Model

```text
n8n gathers external context
-> n8n packages context
-> n8n invokes OpenClaw or a specific agent
-> OpenClaw reasons over supplied context
-> OpenClaw emits structured request candidates
-> n8n executes, stores, delivers, monitors, or re-triggers OpenClaw
```

## Not Allowed

```text
OpenClaw -> database
OpenClaw -> Redis
OpenClaw -> Vector DB
OpenClaw -> knowledge store
OpenClaw -> identity store
OpenClaw -> analytics provider
OpenClaw -> monitoring system
OpenClaw -> Docker/VPS/infrastructure
OpenClaw -> external API
```

## Allowed Memory Flow

Context retrieval:

```text
OpenClaw context_request -> n8n Intent Gateway -> n8n memory/knowledge/identity workflow -> n8n packages context -> OpenClaw re-trigger
```

Memory update:

```text
OpenClaw memory_update request -> n8n Intent Gateway -> n8n memory persist workflow -> storage
```

OpenClaw can request, recommend, classify, summarize, validate, and decide. n8n retrieves and stores.

## Supported Context Scopes

n8n may package these scopes for OpenClaw:

- working memory
- long memory
- private memory
- shared memory
- identity context
- workflow state
- lifecycle state
- knowledge context
- audit/trace context

OpenClaw consumes these scopes only as supplied context in the invocation payload.

## Storage Ownership

Storage is outside OpenClaw.

- Postgres: durable relational memory, identity records, workflow persistence, handoff state, audit records.
- Redis: short-lived workflow/session state, locks, transient coordination.
- Vector DB: sanitized semantic retrieval and knowledge references.
- Knowledge stores: service, FAQ, process, and operational knowledge.

All access to these stores occurs through n8n workflows or infrastructure services, never through OpenClaw agents.

## Packaged Context Requirements

n8n should provide minimal packaged context:

```json
{
  "context_package": {
    "package_id": "<uuid>",
    "source_workflow": "<n8n_workflow_name>",
    "subject_refs": {
      "lead_id": null,
      "account_id": null,
      "contact_id": null,
      "workflow_id": null,
      "trace_id": null
    },
    "scopes": ["working", "identity", "shared"],
    "facts": [],
    "prior_interactions": [],
    "workflow_state": {},
    "knowledge_context": [],
    "constraints": {
      "minimal_context": true,
      "no_raw_secrets": true
    }
  }
}
```

OpenClaw treats packaged context as input, not as storage access.

## Context Request Shape

When context is missing, OpenClaw emits a request candidate:

```json
{
  "id": "<uuid>",
  "type": "context_request",
  "category": "memory|identity|knowledge|workflow_state|lifecycle_state",
  "priority": "low|normal|high|urgent",
  "requester": {
    "id": "<agent-id>",
    "role": "agent|supervisor"
  },
  "subject_refs": {},
  "purpose": "<why_context_is_needed>",
  "required_scopes": [],
  "constraints": {
    "minimal_context": true,
    "no_raw_secrets": true
  },
  "timestamp": "<ISO8601>",
  "version": "1.0"
}
```

This goes to the n8n Intent Gateway. n8n decides how to retrieve, package, persist audit, and re-trigger OpenClaw.

## Memory Update Shape

When memory should be saved, OpenClaw emits:

```json
{
  "id": "<uuid>",
  "type": "memory_update",
  "scope": "working|long|private|shared|identity|audit|knowledge",
  "priority": "low|normal|high|urgent",
  "requester": {
    "id": "<agent-id>",
    "role": "agent|supervisor"
  },
  "subject_refs": {},
  "content": "<sanitized_summary_or_reference>",
  "reason": "<why_this_should_be_saved>",
  "confidence": "low|medium|high",
  "retention_hint": "ephemeral|session|durable",
  "timestamp": "<ISO8601>",
  "version": "1.0"
}
```

n8n owns validation beyond the OpenClaw recommendation, persistence, lifecycle updates, and storage selection.

## Private Memory Rule

Private memory is private by policy, not by OpenClaw storage access.

OpenClaw may label memory as private for an agent using `requester.id` or `owner_agent_id`. n8n enforces storage isolation and retrieval permissions.

## Do Not Store Or Request

- raw secrets
- API keys
- passwords
- tokens
- credentials
- raw sensitive logs
- raw external payloads unless explicitly approved and sanitized by n8n
- unsupported speculation as fact
- direct execution commands intended to bypass n8n

Secrets must remain in `.env`, secret manager, or environment-backed secret references.

## Supervisor Responsibility

`syntra` decides whether a context or memory request is reasonable, minimal, and safe before returning it as an n8n request candidate.

`syntra` does not retrieve or store the memory itself.
