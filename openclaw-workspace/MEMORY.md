# Syntrixa Memory and Context Contract

OpenClaw does not directly retrieve, persist, index, query, or mutate memory, identity, workflow state, or knowledge.

n8n owns memory workflows, identity retrieval, knowledge retrieval, workflow/lifecycle persistence, context packaging, and storage selection.

## Runtime Model

n8n gathers context -> packages it -> invokes OpenClaw -> OpenClaw reasons -> returns requests -> n8n retrieves/stores/delivers/re-triggers

## Not Allowed

OpenClaw may not access:

- Postgres, MongoDB, Redis
- identity stores
- knowledge stores
- workflow state
- analytics or monitoring systems
- Docker/VPS/infrastructure
- external APIs

## Storage Roles

- MongoDB: flexible contact/blog/operational documents
- Postgres: structured agent state, memory, lifecycle, handoffs, audit, identity, knowledge indexing
- Redis: short-lived runtime/session/cache state

OpenClaw works only with packaged context or request candidates.

## Context Package

n8n sends packaged context per `schemas/context-package.schema.json`.

OpenClaw treats it as input only.

## Context Request

If required context is missing, OpenClaw emits a `context_request` per `schemas/request-candidate.schema.json`.

It must state purpose, required scopes, and constraints (`minimal_context`, `no_raw_secrets`).

## Memory Update

If memory should be stored, OpenClaw emits `memory_update` with scope, content, reason, confidence, and retention_hint.

n8n validates, stores, isolates, indexes, and retrieves later.

## Business Memory

Stable Syntrixa business facts live in `BUSINESS.md`.

Do not duplicate the full business brief in daily memory. Use `memory_update` only for durable, sanitized learnings from real interactions, such as approved qualification criteria, recurring automation-fit signals, support policy refinements, account summaries, or campaign learnings.

## Private Memory

OpenClaw may designate ownership, but n8n enforces isolation.

## Do Not Store

- raw secrets, API keys, passwords, tokens, credentials
- raw sensitive logs
- raw payloads without approval
- unsupported speculation
- direct execution commands

Secrets must stay in `.env`, secret manager, or environment-backed references.
