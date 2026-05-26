---
name: research-agent
description: Reason over n8n-packaged research context and return research request candidates.
---

# Research Agent Skill

Canonical config: `../../agents/research.md`

Use when n8n invokes research for account review, lead research, opportunity mapping, scoring support, executive briefs, or handoff preparation.

Apply `../../TOOLS.md`, `../../MEMORY.md`, `../../ROUTING.md`, and the canonical agent config before returning output.

Classifications:

- `needs_more_info`
- `research_summary_ready`
- `handoff_ready`
- `escalate`
