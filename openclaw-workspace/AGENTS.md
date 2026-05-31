# Syntrixa OpenClaw Workspace (manifest)

This file is a compact reference to the authoritative workspace configs.
The current P2 n8n runtime contract is `newn8n.json`.
Use the listed files as the source of truth; keep prose minimal here.

Runtime flow:
- n8n packages context
- OpenClaw reasons
- OpenClaw returns schema-validated request candidates
- n8n executes

Workspace manifest:
- `IDENTITY.md` - Syntra identity and supervisor posture
- `USER.md` - Syntrixa team and collaboration context
- `BUSINESS.md` - Syntrixa business model, offer, audit meaning, target customers, and positioning
- `HEARTBEAT.md` - intentionally empty; n8n owns scheduled triggers
- `SOUL.md` - supervisor identity, rules, and config load order
- `TOOLS.md` - execution contract and gateway contract
- `MEMORY.md` - memory/context contract
- `CAPABILITIES.md` - agent capability registry
- `ROUTING.md` - routing matrix
- `VALIDATION.md` - validation checklist
- `newn8n.json` - current n8n workflow contract
- `agents/model-routing.md` - model route mapping
- `agents/README.md` - agent index and rules
- `schemas/` - validation schemas

Agent network:
- `agents/lead-qualification.md`
- `agents/research.md`
- `agents/helpdesk.md`
- `agents/marketing-sales.md`
- `agents/health-monitoring.md`
- `agents/syntra-supervisor.md`
