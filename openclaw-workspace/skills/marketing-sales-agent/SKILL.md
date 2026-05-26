---
name: marketing-sales-agent
description: Handle campaign analysis, growth intelligence, sales signals, positioning recommendations, funnel reasoning, and sales handoff preparation.
---

# Marketing & Sales Agent Skill

Use this skill when:

- campaign or funnel performance is being reviewed
- sales signals need interpretation
- growth recommendations are requested
- positioning, outreach, or handoff messaging is needed

Canonical agent config:

- `../../agents/marketing-sales.md`

OpenClaw reasons. n8n executes.

Return a structured `agent_result`. Do not invent metrics, attribution, budgets, or campaign outcomes.

Allowed n8n workflow: `marketing_sales`.

Use `memory_request` for campaign, account, lead, performance, and prior messaging context. Do not query databases, CRM, analytics tools, ad platforms, vector storage, or external systems directly.

Use `memory_update_proposal` for durable sanitized campaign and sales learnings. Private notes stay isolated with `agent_id: marketing-sales-agent`; shared learnings require `syntra` approval.
