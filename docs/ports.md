# Syntrixa Fixed Port Registry

Keep these ports stable across local Docker and VPS deployment.

Local host bindings use `127.0.0.1:<port>:<port>` for control ports so NemoClaw/OpenClaw stays fixed but is not exposed on every network interface. Internal-only service ports stay fixed through Docker networking and `expose`. On the VPS, keep these services private behind Nginx unless a port is intentionally made public.

Containers communicate internally by Docker service name and container port.

## Active Now

| Service | Docker service name | Container name | Internal URL | Host port |
| --- | --- | --- | --- | --- |
| NemoClaw manager | `nemoclaw` | `syntrixa-nemoclaw` | `http://nemoclaw:18789` | `127.0.0.1:18789` |
| OpenClaw invoke wrapper | `nemoclaw` | `syntrixa-nemoclaw` | `http://nemoclaw:8990` | `127.0.0.1:8990` |
| NemoClaw dashboard / OpenClaw UI | managed inside `nemoclaw` | `syntrixa-openclaw` sandbox | `http://nemoclaw:18789` | `127.0.0.1:18789` |

## Reserved For Later

| Service | Docker service name | Container name | Internal URL | Host port |
| --- | --- | --- | --- | --- |
| n8n | `n8n` | `syntrixa-n8n` | `http://n8n:5678` | `5678` |
| PostgreSQL | `postgres` | `syntrixa-postgres` | `postgres:5432` | `5432` |
| MongoDB | `mongodb` | `syntrixa-mongodb` | `mongodb://mongodb:27017` | `27017` |
| Redis | `redis` | `syntrixa-redis` | `redis:6379` | `6379` |
| Nginx | `nginx` | `syntrixa-nginx` | `http://nginx:80` / `https://nginx:443` | `80`, `443` |
| Prometheus | `prometheus` | `syntrixa-prometheus` | `http://prometheus:9090` | `9090` |
| Grafana | `grafana` | `syntrixa-grafana` | `http://grafana:3000` | `3000` |
| vLLM / NIM inference | managed by NemoClaw | managed by NemoClaw | `http://nemoclaw:8000` | internal only |
| Ollama inference | managed by NemoClaw | managed by NemoClaw | `http://nemoclaw:11434` | internal only |
| Ollama auth proxy | managed by NemoClaw | managed by NemoClaw | `http://nemoclaw:11435` | internal only |

## NemoClaw Status

The `nemoclaw` manager container is active.

The secured OpenClaw sandbox uses a local OpenAI-compatible security stub by default.

Default local route:

```text
NEMOCLAW_PROVIDER=custom
NEMOCLAW_ENDPOINT_URL=http://127.0.0.1:8000/v1
NEMOCLAW_MODEL=syntrixa-security-stub
COMPATIBLE_API_KEY=dummy
```

Replace this with the real model provider later.

## OpenClaw To n8n Contract

OpenClaw should refer to n8n internally as:

```text
http://n8n:5678
```

Default webhook path:

```text
/webhook/openclaw/intent
```

This matches the imported n8n workflow webhook node:

- workflow file: `newn8n.json`
- node: `UTIL001 Normalize Gateway Envelope`
- method: `POST`
- n8n path: `openclaw/intent`

Do not use `localhost` for container-to-container calls.

Inside Docker, `localhost` means the current container.

## n8n To OpenClaw Invocation

The latest workflow file `newn8n.json` invokes OpenClaw through:

```text
env:OPENCLAW_AGENT_INVOKE_URL
```

Current fallback in `newn8n.json`:

```text
http://nemoclaw:8990/openclaw/agent/invoke
```

This is implemented by `agent-invoke-server.mjs` inside the `nemoclaw` container. The real OpenClaw reasoning backend can be wired behind this endpoint later without changing P2 workflows.
