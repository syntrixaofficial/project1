# Syntrixa OpenClaw Workspace

This repo contains the Syntrixa workspace for the real OpenClaw runtime.

We are not building OpenClaw from scratch.

OpenClaw must run inside NVIDIA NemoClaw/OpenShell inside Docker for this project.

Do not use a host-installed OpenClaw runtime for development.

Secrets must live in root `.env` or environment-backed OpenClaw SecretRefs.

Do not store secrets in `openclaw.json`.

Strict rule:

- OpenClaw reasons and emits structured execution intents.
- n8n executes all external actions.
- OpenClaw agents do not call external service APIs, authenticate third-party services, send email, or mutate external systems directly.
- OpenClaw agents do not directly read or write Postgres, Redis, Vector DB, memory files, identity stores, knowledge stores, workflow persistence, monitoring systems, Docker, VPS infrastructure, analytics providers, communication channels, or external APIs.
- n8n gathers and packages context before invoking OpenClaw. Missing context becomes a `context_request` candidate. Durable storage becomes a `memory_update` candidate.

## Docker Workflow

Build the container with NVIDIA NemoClaw installed inside it:

```powershell
cd C:\Users\shreeram\OneDrive\Desktop\project1
copy .env.example .env
docker compose build nemoclaw
```

Start the NemoClaw manager container:

```powershell
docker compose up -d nemoclaw
```

Verify NemoClaw inside the container:

```powershell
docker compose exec nemoclaw nemoclaw --version
docker compose exec nemoclaw openshell --version
```

This project uses NemoClaw as a security/sandbox layer, not as the required model provider.

By default, onboarding uses a local OpenAI-compatible security stub:

```text
NEMOCLAW_PROVIDER=custom
NEMOCLAW_ENDPOINT_URL=http://127.0.0.1:8000/v1
NEMOCLAW_MODEL=syntrixa-security-stub
COMPATIBLE_API_KEY=dummy
```

The stub exists only so the secured OpenClaw sandbox can be created before the real model provider is chosen.
Configure a real model provider before production reasoning.

Create or refresh the secured OpenClaw sandbox:

```powershell
docker compose exec nemoclaw nemoclaw onboard --non-interactive --name syntrixa-openclaw --no-gpu --no-sandbox-gpu --control-ui-port 18789 --yes --yes-i-accept-third-party-software
```

If onboarding already reached provider setup, resume after adding the key:

```powershell
docker compose up -d nemoclaw
docker compose exec nemoclaw nemoclaw onboard --resume --non-interactive --name syntrixa-openclaw --no-gpu --no-sandbox-gpu --control-ui-port 18789 --yes --yes-i-accept-third-party-software
```

Check status and health:

```powershell
docker compose ps
docker compose logs --tail=80 nemoclaw
docker compose exec nemoclaw nemoclaw list
docker compose exec nemoclaw nemoclaw syntrixa-openclaw status
```

Open the secured OpenClaw dashboard locally at:

```text
http://127.0.0.1:18789/
```

The workspace is mounted from `openclaw-workspace/`.

NemoClaw and its nested OpenShell/OpenClaw runtime state are stored in Docker volumes, not in this repo.

Security protocol: [docs/security.md](docs/security.md).

## Fixed Ports

Port assignments are fixed in [docs/ports.md](docs/ports.md).

Important internal addresses:

- NemoClaw/OpenClaw UI: `http://nemoclaw:18789`
- n8n later: `http://n8n:5678`
- OpenClaw-to-n8n intent gateway: `http://n8n:5678/webhook/openclaw/intent`
- PostgreSQL later: `postgres:5432`
- Redis later: `redis:6379`
- Vector DB later: `http://vector-db:6333`

Do not use `localhost` for container-to-container communication.

## Structure

- `openclaw-workspace/AGENTS.md` - workspace role, boundaries, and startup rules
- `openclaw-workspace/SOUL.md` - compact supervisor identity and startup pointer
- `openclaw-workspace/agents/` - canonical per-agent configuration files
- `openclaw-workspace/TOOLS.md` - execution boundary and n8n Intent Gateway contract
- `openclaw-workspace/MEMORY.md` - n8n-mediated memory and context contract
- `openclaw-workspace/memory/` - daily memory files
- `openclaw-workspace/skills/*/SKILL.md` - reusable OpenClaw skills
