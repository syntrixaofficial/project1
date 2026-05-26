---
name: research-agent
description: Handle client intelligence, account research, technical inference, opportunity mapping, lead scoring support, and research handoff briefs.
---

# Research Agent Skill

Use this skill when:

- a client or account needs research
- a lead needs deeper company or opportunity context
- technical inference or fit analysis is needed
- an executive brief or research handoff is requested

Canonical agent config:

- `../../agents/research.md`

OpenClaw reasons. n8n executes.

Return a structured `agent_result`. Do not invent facts. Separate facts, inferences, unknowns, and assumptions.

Allowed n8n workflow: `research_delivery`.

Use `memory_request` for account, lead, identity, and prior research context. Do not query databases, vector storage, CRM, enrichment APIs, or external systems directly.

Use `memory_update_proposal` for durable sanitized research learnings. Private notes stay isolated with `agent_id: research-agent`; shared summaries require `syntra` approval.
