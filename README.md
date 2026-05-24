# Syntrixa OpenClaw Workspace

This repo contains the Syntrixa workspace for the real OpenClaw runtime.

We are not building OpenClaw from scratch.

OpenClaw must run inside Docker for this project.

Do not use a host-installed OpenClaw runtime for development.

Secrets must live in root `.env` or environment-backed OpenClaw SecretRefs.

Do not store secrets in `openclaw.json`.

Strict rule:

- OpenClaw reasons and emits structured execution intents.
- n8n executes all external actions.
- OpenClaw agents do not call external service APIs, authenticate third-party services, send email, or mutate external systems directly.

## Docker Workflow

Build the container with the real OpenClaw CLI installed inside it:

```powershell
cd C:\Users\shreeram\OneDrive\Desktop\project1
copy .env.example .env
docker compose build openclaw
```

Verify OpenClaw inside the container:

```powershell
docker compose run --rm openclaw openclaw --version
```

Initialize container-local OpenClaw state:

```powershell
docker compose run --rm openclaw openclaw onboard --non-interactive --accept-risk --mode local --flow quickstart --auth-choice skip --workspace /workspace/openclaw-workspace --skip-daemon --skip-channels --skip-health --suppress-gateway-token-output
docker compose run --rm openclaw openclaw config set gateway.bind lan
```

Start the OpenClaw gateway container:

```powershell
docker compose up -d openclaw
```

Check status and health:

```powershell
docker compose ps
docker compose logs --tail=80 openclaw
docker compose exec openclaw openclaw health
```

The workspace is mounted from `openclaw-workspace/`.

OpenClaw state is stored in the Docker volume `openclaw-state`, not in this repo.

Security protocol: [docs/security.md](docs/security.md).

## Fixed Ports

Port assignments are fixed in [docs/ports.md](docs/ports.md).

Important internal addresses:

- OpenClaw: `http://openclaw:18789`
- n8n later: `http://n8n:5678`
- PostgreSQL later: `postgres:5432`
- Redis later: `redis:6379`

Do not use `localhost` for container-to-container communication.

## Structure

- `openclaw-workspace/AGENTS.md` - workspace role, boundaries, and startup rules
- `openclaw-workspace/SOUL.md` - operating identity and behavioral posture
- `openclaw-workspace/TOOLS.md` - execution boundary and n8n tool contract
- `openclaw-workspace/MEMORY.md` - durable architecture decisions
- `openclaw-workspace/memory/` - daily memory files
- `openclaw-workspace/skills/*/SKILL.md` - reusable OpenClaw skills
