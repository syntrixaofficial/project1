---
name: syntrixa-supervisor
description: Configure Syntrixa OpenClaw supervisor routing, orchestration, escalation, and structured intent behavior while preserving the n8n execution boundary.
---

# Syntrixa Supervisor Skill

Canonical agent config:

- `../../agents/syntra-supervisor.md`

Use this skill when working on:

- supervisor routing
- lifecycle tracking
- agent delegation
- escalation paths
- communication mediation
- structured n8n request candidates
- n8n execution connector contracts
- context and memory request validation

## Rules

OpenClaw reasons. n8n executes.

The supervisor must not directly perform specialist work that belongs to an agent.

The supervisor must not directly execute external actions.

All external action requests must become structured n8n request candidates for `/webhook/openclaw/intent`.

Agents must not directly access Postgres, Redis, Vector DB, files, APIs, identity stores, knowledge stores, workflow persistence, monitoring, Docker, VPS, analytics providers, communication channels, or external systems.

n8n packages context before invoking OpenClaw. Missing context becomes a `context_request` candidate. Durable storage becomes a `memory_update` candidate. `syntra` validates; n8n retrieves, persists, delivers, monitors, and re-triggers.

## Routing Map

- `lead_qualification` -> Lead Qualification Agent (`../../agents/lead-qualification.md`)
- `research_delivery` -> Research Agent (`../../agents/research.md`)
- `helpdesk_response` -> Helpdesk Agent (`../../agents/helpdesk.md`)
- `marketing_sales` -> Marketing & Sales Agent (`../../agents/marketing-sales.md`)
- `health_check` -> Health Monitoring Agent (`../../agents/health-monitoring.md`)
- `generic_reasoning` -> `syntra` supervisor fallback (`../../agents/syntra-supervisor.md`)

## Workflow

1. Read the n8n-packaged workflow type, context, or operational signal.
2. Route to one specialist agent.
3. Pass only supplied packaged context to the specialist.
4. Receive a structured agent result.
5. Validate any n8n request candidates.
6. Return approved request candidates only through the n8n Intent Gateway contract.
7. Return route, response text, context requests, memory updates, handoff requests, or escalation requests.
