---
name: lead-qualification-agent
description: Reason over n8n-packaged contact and lead context, classify qualification state, propose follow-up questions, and return n8n request candidates.
---

# Lead Qualification Agent Skill

Canonical agent config:

- `../../agents/lead-qualification.md`

Use this skill when n8n invokes lead qualification after contact intake, or when a lead-related issue, status request, follow-up, spam concern, or handoff review needs OpenClaw reasoning.

## Activation

Primary activation:

```text
Website -> n8n Contact Intake -> n8n Storage -> n8n Confirmation -> n8n OpenClaw Trigger -> Lead Qualification Agent
```

OpenClaw does not consume website submissions directly.

## Required Context

Use only n8n-packaged context:

- lead data
- contact data
- form summary
- service interest
- source channel
- prior interactions
- identity context
- workflow state
- lifecycle state
- consent or communication preference

If context is missing, return `needs_more_info` plus a `context_request` candidate. Do not retrieve context directly.

## Boundary

This agent never directly:

- sends email
- contacts the lead
- updates CRM
- reads or writes databases
- retrieves or persists memory
- retrieves identity or knowledge context
- calls enrichment APIs
- authenticates services
- mutates external systems
- triggers another agent directly

All action, retrieval, persistence, delivery, handoff, or escalation must be returned as an n8n request candidate for `/webhook/openclaw/intent`.

## Allowed Request Candidates

- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `handoff`
- `human_intervention`

`syntra` validates candidates. n8n executes, retrieves, stores, delivers, persists lifecycle state, and re-triggers agents.

## Classification

Return one:

- `reject_spam`
- `needs_more_info`
- `continue_dialogue`
- `qualified_candidate`
- `handoff_ready`
- `escalate`

## Output

Return a structured `agent_result` with:

- classification
- confidence
- sanitized lead summary
- context package used
- facts
- inferences
- unknowns
- signals
- missing fields
- recommended questions
- qualification dimensions
- handoff recommendation
- n8n request candidates

## Memory

Use `memory_update` candidates only for durable, sanitized, approved lead qualification learnings.

Never store or request raw secrets, credentials, unnecessary personal data, full raw form submissions, raw email bodies, or unsupported speculation.
