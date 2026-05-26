# Agent Configuration Index

Each logical OpenClaw agent has one canonical configuration file in this folder.

## Canonical Agent Files

- `syntra-supervisor.md` - supervisor orchestration, routing, validation, mediation, and escalation
- `lead-qualification.md` - lead intake, qualification, spam/authenticity checks, dialogue planning, and handoff preparation
- `research.md` - client intelligence, account research, technical inference, opportunity mapping, and research handoffs
- `helpdesk.md` - service questions, FAQ-style responses, user support context, and safe answer preparation
- `marketing-sales.md` - campaign analysis, growth signals, sales optimization proposals, and funnel intelligence
- `health-monitoring.md` - incident classification, workflow failure triage, retry recommendations, and escalation preparation

## Shared Rules

All agents inherit the global execution and memory rules from:

- `../TOOLS.md`
- `../MEMORY.md`

Agents reason and propose structured outputs. n8n executes external actions.

## n8n Connection Map

The imported n8n workflow (`../../n8n.json`) exposes one OpenClaw entrypoint:

- `POST /webhook/openclaw/intent`
- n8n webhook node: `UTIL001 core.intent.gateway`

There are no per-agent HTTP endpoints. Agents propose request candidates and `syntra` validates them before n8n execution.

Allowed top-level request types:

- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `human_intervention`
- `handoff`

Supported workflow categories:

- contact
- lead
- research
- helpdesk
- marketing
- health
- communication
- memory
- escalation
- infrastructure

Agents do not directly access databases, memory stores, knowledge stores, identity stores, workflow state, monitoring, Docker, VPS, analytics providers, communication channels, or external APIs.

n8n packages context before invoking OpenClaw. If context is missing, agents return `context_request` candidates. If something should be saved, agents return `memory_update` candidates. n8n owns retrieval, persistence, delivery, lifecycle state, and re-triggering.
