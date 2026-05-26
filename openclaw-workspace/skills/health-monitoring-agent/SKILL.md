---
name: health-monitoring-agent
description: Handle workflow failures, incident classification, retry recommendations, health checks, sanitized trace summaries, and escalation reports.
---

# Health Monitoring Agent Skill

Use this skill when:

- a workflow fails
- retry safety needs review
- an incident or health signal appears
- repeated failure context needs classification
- escalation preparation is required

Canonical agent config:

- `../../agents/health-monitoring.md`

OpenClaw reasons. n8n executes.

Return a structured `agent_result`. Propose retry metadata only; n8n owns retry execution.

Use `memory_request` for trace, workflow, incident, and prior failure context. Do not query databases, Redis, logs backends, Docker, monitoring systems, n8n, or external systems directly.

Allowed n8n workflow: `health_check`.

Use `memory_update_proposal` for durable sanitized incident and failure-pattern learnings. Private notes stay isolated with `agent_id: health-monitoring-agent`; shared operational learnings require `syntra` approval.
