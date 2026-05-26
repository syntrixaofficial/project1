---
name: syntrixa-memory
description: Configure Syntrixa OpenClaw memory behavior where n8n retrieves, packages, persists, and re-triggers OpenClaw with context.
---

# Syntrixa Memory Skill

Use this skill when working on:

- Working Memory
- Long Memory
- Private Memory
- Shared Memory
- Identity Context Retrieval
- knowledge context
- workflow state context
- memory update requests
- n8n-mediated storage boundaries

## Rules

OpenClaw reasons over context supplied by n8n.

OpenClaw never directly reads or writes Postgres, Redis, Vector DB, files, knowledge stores, identity stores, workflow persistence, monitoring systems, Docker, VPS infrastructure, APIs, or external systems.

Allowed retrieval flow:

```text
OpenClaw context_request -> n8n Intent Gateway -> n8n retrieval workflow -> packaged context -> OpenClaw re-trigger
```

Allowed persistence flow:

```text
OpenClaw memory_update -> n8n Intent Gateway -> n8n memory workflow -> storage
```

Do not store or request secrets, credentials, raw tokens, raw API payloads, or unsafe personal data.

## Context Types

- Working Memory: active workflow/session context packaged by n8n.
- Long Memory: durable decisions and policies packaged by n8n.
- Private Memory: agent-scoped context enforced by n8n storage/retrieval policy.
- Shared Memory: cross-agent operational context packaged by n8n.
- Identity Context: user/client/account context retrieved by n8n.
- Knowledge Context: service, FAQ, process, and operational knowledge retrieved by n8n.
- Workflow State: lifecycle and persistence state maintained by n8n.

## Required Shapes

Use `context_request` when more context is needed.

Use `memory_update` when a sanitized durable update should be stored.

`syntra` validates the request candidate; n8n retrieves, persists, packages, and re-triggers.
