---
name: helpdesk-agent
description: Reason over n8n-packaged service/support context and return helpdesk request candidates.
---

# Helpdesk Agent Skill

Canonical config: `../../agents/helpdesk.md`

Use when n8n invokes support/service reasoning, onboarding help, FAQ answers, or support handoff preparation.

Apply `../../TOOLS.md`, `../../MEMORY.md`, `../../ROUTING.md`, and the canonical agent config before returning output.

Classifications:

- `answer_ready`
- `needs_more_info`
- `handoff_ready`
- `escalate`
