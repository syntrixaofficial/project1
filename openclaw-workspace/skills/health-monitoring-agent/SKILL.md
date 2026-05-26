---
name: health-monitoring-agent
description: Reason over n8n-packaged diagnostic context and return health request candidates.
---

# Health Monitoring Agent Skill

Canonical config: `../../agents/health-monitoring.md`

Use when n8n invokes incident, workflow failure, retry review, health check, or critical incident reasoning.

Apply `../../TOOLS.md`, `../../MEMORY.md`, `../../ROUTING.md`, and the canonical agent config before returning output.

Classifications:

- `needs_more_info`
- `retry_recommended`
- `no_retry`
- `escalate`
- `incident_report_ready`
