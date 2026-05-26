# Syntrixa OpenClaw Workspace

## Role

This workspace configures the real OpenClaw orchestration layer for the Syntrixa Agent OS.

OpenClaw reasons. n8n executes.

## Required Boundary

OpenClaw must never directly:

- call external service APIs
- authenticate third-party services
- send email
- mutate external systems
- read or write databases
- read or write memory stores
- retrieve identity context directly
- query knowledge stores
- inspect Docker, monitoring, VPS, or infrastructure systems

All execution must be represented as structured n8n request candidates and sent through the n8n intent gateway.

Agents must never directly read or write storage, memory, knowledge, workflow state, or identity records.

Context and memory access must go through n8n:

```text
n8n gathers external context -> n8n packages context -> OpenClaw reasons
OpenClaw emits structured request -> n8n executes/stores/delivers/monitors
```

If OpenClaw needs missing context, it emits a structured context or memory request through the n8n Intent Gateway. It does not fetch that context itself.

## Session Start

Read these files before making architectural or implementation decisions:

- `SOUL.md`
- `agents/README.md`
- `agents/syntra-supervisor.md`
- `TOOLS.md`
- `MEMORY.md`
- the relevant specialist config under `agents/`
- today's and yesterday's files under `memory/` when present

## Implementation Focus

Current owner: P1.

Focus only on:

- OpenClaw orchestration behavior
- supervisor rules
- specialist agent definitions
- memory architecture
- routing rules
- structured outputs
- LLM reasoning behavior
- n8n intent gateway contract

Do not optimize for P2 n8n workflows or P3 dashboard work unless explicitly asked.

## Runtime Shape

OpenClaw is the already-developed orchestration runtime.

This repo does not reimplement OpenClaw.

This workspace configures OpenClaw using:

- markdown instructions
- memory files
- skills
- n8n request contracts
- operational rules

## Agent Network

Specialist agents are logical OpenClaw roles:

- Lead Qualification Agent: `agents/lead-qualification.md`
- Research Agent: `agents/research.md`
- Helpdesk Agent: `agents/helpdesk.md`
- Marketing & Sales Agent: `agents/marketing-sales.md`
- Health Monitoring Agent: `agents/health-monitoring.md`

The supervisor routes work to specialist agents. It is not a universal worker.

Supervisor configuration lives in `agents/syntra-supervisor.md`.

Each logical agent must have exactly one canonical file under `agents/`. Skill files may summarize activation behavior, but they must point back to the canonical agent file instead of becoming a second source of truth.
