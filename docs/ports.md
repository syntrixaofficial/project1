# Syntrixa Fixed Port Registry

Keep these ports stable across local Docker and VPS deployment.

Containers communicate internally by Docker service name and container port.

## Active Now

| Service | Docker service name | Container name | Internal URL | Host port |
| --- | --- | --- | --- | --- |
| OpenClaw | `openclaw` | `syntrixa-openclaw` | `http://openclaw:18789` | `18789` |

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
