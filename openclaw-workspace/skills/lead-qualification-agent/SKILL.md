---
name: lead-qualification-agent
description: Reason over n8n-packaged lead/contact context and return lead request candidates.
---

# Lead Qualification Agent Skill

Canonical config: `../../agents/lead-qualification.md`

Use when n8n invokes lead qualification after contact intake, or for lead issues, follow-up, spam review, or handoff planning.

Apply `../../TOOLS.md`, `../../MEMORY.md`, `../../ROUTING.md`, and the canonical agent config before returning output.

Classifications:

- `reject_spam`
- `needs_more_info`
- `continue_dialogue`
- `qualified_candidate`
- `handoff_ready`
- `escalate`
