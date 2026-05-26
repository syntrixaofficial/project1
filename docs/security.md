# Syntrixa OpenClaw Security Protocol

## Secret Storage Rule

Secrets must never be stored in:

- `openclaw-workspace/`
- `AGENTS.md`
- `SOUL.md`
- `MEMORY.md`
- `TOOLS.md`
- `skills/*/SKILL.md`
- `openclaw.json`
- committed docs

Secrets must be provided through:

- root `.env` for local Docker
- VPS environment variables or secret manager later
- OpenClaw SecretRefs that resolve from environment variables

## Required Pattern

OpenClaw config should reference secrets like:

```text
env:OPENCLAW_GATEWAY_TOKEN
env:N8N_OPENCLAW_WEBHOOK_SECRET
env:NVIDIA_API_KEY
env:NEMOCLAW_PROVIDER_KEY
env:COMPATIBLE_API_KEY
env:SYNTRA_MODEL_API_KEY
env:LEAD_QUALIFICATION_MODEL_API_KEY
env:RESEARCH_MODEL_API_KEY
env:HELPDESK_MODEL_API_KEY
env:MARKETING_SALES_MODEL_API_KEY
env:HEALTH_MONITORING_MODEL_API_KEY
```

The default local `COMPATIBLE_API_KEY=dummy` is not a real secret. It is used only for the local security stub.

Do not paste actual API keys into OpenClaw config commands unless the command stores them as SecretRefs.

Per-agent model keys are allowed only as environment-backed SecretRefs. The mapping is documented in `openclaw-workspace/agents/model-routing.md`.

## Docker Boundary

OpenClaw runs only inside the Docker container.

Host OpenClaw and host NemoClaw must remain uninstalled.

NemoClaw/OpenShell owns the secure sandbox around OpenClaw.

The project uses a Docker-only manager container named `syntrixa-nemoclaw`.

## Execution Boundary

OpenClaw reasons.

n8n executes.

OpenClaw must not directly:

- call external service APIs
- authenticate services
- send email
- mutate external systems
- read or write databases
- retrieve or persist memory
- retrieve identity or knowledge context
- inspect monitoring, Docker, VPS, analytics, or infrastructure systems

## Memory Storage Boundary

Specialist agents must not directly:

- read or write Postgres
- read or write MongoDB
- read or write Redis
- write memory files
- store secrets in memory

Allowed memory/context flow:

```text
n8n gathers context -> n8n packages context -> OpenClaw reasons
OpenClaw context_request or memory_update -> n8n Intent Gateway -> n8n workflow -> storage/re-trigger
```

Private agent memory must be isolated by `agent_id` in n8n-managed storage/retrieval policy. Shared memory requires n8n-mediated approval and packaging.

## Review Rule

Before each new configuration step:

1. Write the config/instruction file.
2. User reviews it.
3. Only then proceed to the next config area.
