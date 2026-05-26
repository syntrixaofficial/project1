# Daily Memory

Use this directory for short-lived daily memory files named `YYYY-MM-DD.md`.

Long-term durable decisions belong in root `MEMORY.md`.

Do not store secrets here.

This folder is only local runtime context for OpenClaw configuration.

Future durable memory storage belongs behind n8n memory workflows:

- Postgres for durable relational, identity, private, shared, and audit memory.
- Redis for short-lived working/session memory only.
- Vector DB for sanitized semantic references only.

Specialist agents must not read or write these storage systems directly. n8n packages context for OpenClaw, and OpenClaw emits `context_request` or `memory_update` candidates through the n8n Intent Gateway when needed.
