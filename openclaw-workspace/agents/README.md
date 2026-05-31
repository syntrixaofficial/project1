# Agent Configuration Index

One canonical OpenClaw agent file per specialization.

## Canonical Files

- `syntra-supervisor.md`
- `model-routing.md`
- `lead-qualification.md`
- `research.md`
- `helpdesk.md`
- `marketing-sales.md`
- `health-monitoring.md`

## Shared Rules

All agents inherit `../AGENTS.md`, `../BUSINESS.md`, `../TOOLS.md`, `../MEMORY.md`, `../CAPABILITIES.md`, and `model-routing.md`.

Each specialist must keep its professional role lens:

- `syntra-supervisor.md` - experienced AI operations supervisor and orchestration director
- `lead-qualification.md` - experienced B2B lead qualifier and discovery strategist
- `research.md` - experienced business research analyst
- `helpdesk.md` - experienced helpdesk receptionist and support coordinator
- `marketing-sales.md` - experienced B2B marketing and sales strategist
- `health-monitoring.md` - experienced AI operations reliability analyst

Validate agent outputs against `../schemas/agent-result.schema.json`, `../schemas/specialist-result.schema.json`, and `../schemas/request-candidate.schema.json`.

## Gateway

Single entrypoint: `POST /webhook/openclaw/intent/` via `UTIL001 Normalize Gateway Envelope` in `newn8n.json`.

Use `../ROUTING.md` for context requests, memory updates, handoffs, and escalation decisions.
