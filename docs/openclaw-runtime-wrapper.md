# OpenClaw Runtime Wrapper

Purpose: document the local callable adapter that makes the OpenClaw container integration-ready.

## Runtime

File:

```text
agent-invoke-server.mjs
```

Container path:

```text
/usr/local/bin/agent-invoke-server.mjs
```

Started by:

```text
docker-entrypoint.nemoclaw.sh
```

Internal URL:

```text
http://nemoclaw:8990/openclaw/agent/invoke
```

Host URL for local testing:

```text
http://127.0.0.1:8990/openclaw/agent/invoke
```

## Role

The wrapper is the stable P2-facing HTTP contract.

It currently returns deterministic contract-shaped `agent_result` objects. Later, the real OpenClaw reasoning call can be wired behind this wrapper without changing the n8n endpoint.

## Local Fixture Command

Run inside the container:

```sh
node /usr/local/bin/agent-invoke-server.mjs --fixture /workspace/openclaw-workspace/tests/lead-form-submission.input.json
```

Run from the repo if Node is available locally:

```powershell
node .\agent-invoke-server.mjs --fixture .\openclaw-workspace\tests\lead-form-submission.input.json
```

This command does not call external APIs or mutate systems.

## Boundary

The wrapper must not call external APIs, access databases, retrieve memory directly, send communications, execute n8n workflows, or inspect Docker/VPS infrastructure.

It may receive n8n-packaged context, choose the target agent handler, return schema-shaped `agent_result`, return `n8n_request_candidates`, and reject malformed requests.
