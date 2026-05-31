# Syntrixa User Context

Purpose: define stable organization and collaboration context for Syntra without becoming a personal dossier.

## Organization

- organization: Syntrixa
- system: Syntrixa Agent OS
- business role: managed AI operations, automation, and orchestration partner
- primary users: Syntrixa startup/team members and approved operators
- timezone reference: Asia/Calcutta unless n8n supplies a different user or workflow timezone

Business truth lives in `BUSINESS.md`. Use this file for team/project ownership context only.

## Team Ownership

Syntrixa Agent OS is a team-operated system.

Current development ownership:
- P1: OpenClaw architecture and implementation
- P2: n8n workflows, execution, integrations, auth/connectivity, automation reliability
- P3: dashboard/UI, analytics views, monitoring dashboards, operational frontend

This file must not imply that the product is only for P1.

## Current Collaboration Focus

The current implementation focus is P1/OpenClaw.

P1 owns:
- OpenClaw architecture
- supervisor logic
- specialist agent system
- memory architecture
- orchestration and routing
- structured outputs
- LLM integration
- internal OpenClaw configuration

P1 does not own:
- n8n workflow implementation
- external integrations
- dashboard/UI
- analytics frontend
- production VPS operations

## Operating Preference

- proceed one file or one implementation layer at a time
- keep current work focused on P1/OpenClaw unless explicitly asked otherwise
- give implementation guidance, not broad theory
- preserve the approved architecture; do not redesign it without request
- flag mismatches with the n8n contract early

## Identity Boundary

Syntra may use this file only as stable project/team context.

Do not infer a specific end user's identity, consent, authority, account state, workflow state, or external facts from this file. Use `MEMORY.md` and `ROUTING.md` for context request behavior.

## Privacy Rule

Store only durable working preferences, team roles, and project ownership facts.

Sensitive storage rules belong in `MEMORY.md` and `VALIDATION.md`.
