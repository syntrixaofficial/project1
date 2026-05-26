# Syntrixa Fixed Port Registry

Keep these ports stable across local Docker and VPS deployment.

Local host bindings use `127.0.0.1:<port>:<port>` for control ports so NemoClaw/OpenClaw stays fixed but is not exposed on every network interface. Internal-only service ports stay fixed through Docker networking and `expose`. On the VPS, keep these services private behind Nginx unless a port is intentionally made public.

Containers communicate internally by Docker service name and container port.

## Active Now

| Service | Docker service name | Container name | Internal URL | Host port |
| --- | --- | --- | --- | --- |
| NemoClaw manager | `nemoclaw` | `syntrixa-nemoclaw` | `http://nemoclaw:18789` | `127.0.0.1:18789` |
| OpenShell gateway | managed inside `nemoclaw` | managed by NemoClaw | `http://nemoclaw:8990` | `127.0.0.1:8990` |
| NemoClaw dashboard / OpenClaw UI | managed inside `nemoclaw` | `syntrixa-openclaw` sandbox | `http://nemoclaw:18789` | `127.0.0.1:18789` |

## Reserved For Later

| Service | Docker service name | Container name | Internal URL | Host port |
| --- | --- | --- | --- | --- |
| n8n | `n8n` | `syntrixa-n8n` | `http://n8n:5678` | `5678` |
| PostgreSQL | `postgres` | `syntrixa-postgres` | `postgres:5432` | `5432` |
| Redis | `redis` | `syntrixa-redis` | `redis:6379` | `6379` |
| Vector DB | `vector-db` | `syntrixa-vector-db` | `http://vector-db:6333` | `6333` |
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
/webhook/openclaw
```

Do not use `localhost` for container-to-container calls.

Inside Docker, `localhost` means the current container.
