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

All execution must be represented as structured workflow intents and sent to n8n.

## Session Start

Read these files before making architectural or implementation decisions:

- `SOUL.md`
- `TOOLS.md`
- `MEMORY.md`
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
- n8n execution contract

Do not optimize for P2 n8n workflows or P3 dashboard work unless explicitly asked.

## Runtime Shape

OpenClaw is the already-developed orchestration runtime.

This repo does not reimplement OpenClaw.

This workspace configures OpenClaw using:

- markdown instructions
- memory files
- skills
- execution contracts
- operational rules

## Agent Network

Specialist agents are logical OpenClaw roles:

- Lead Qualification Agent
- Research Agent
- Helpdesk Agent
- Marketing & Sales Agent
- Health Monitoring Agent

The supervisor routes work to specialist agents. It is not a universal worker.

