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
```

Do not paste actual API keys into OpenClaw config commands unless the command stores them as SecretRefs.

## Docker Boundary

OpenClaw runs only inside the Docker container.

Host OpenClaw must remain uninstalled.

## Execution Boundary

OpenClaw reasons.

n8n executes.

OpenClaw must not directly:

- call external service APIs
- authenticate services
- send email
- mutate external systems

## Review Rule

Before each new configuration step:

1. Write the config/instruction file.
2. User reviews it.
3. Only then proceed to the next config area.
