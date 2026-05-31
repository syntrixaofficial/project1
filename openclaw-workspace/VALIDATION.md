# Syntrixa OpenClaw Validation Checklist

Purpose: final P1 checklist before any OpenClaw output is accepted by n8n.

## Request Candidate Contract

All OpenClaw request candidates must include:
- `id`
- `type`
- `category`
- `priority`
- `requester`
- `timestamp`
- `version`

The current P2 contract requires `version: 1.0`.

## Output Shape

Validate against:
- `schemas/request-candidate.schema.json`
- `schemas/agent-result.schema.json`
- `schemas/specialist-result.schema.json`

## Boundary Checks

Reject output if it:
- claims external execution occurred
- calls for OpenClaw to access APIs, databases, files, channels, Docker, monitoring, VPS, analytics, identity stores, knowledge stores, or workflow state
- includes raw secrets, credentials, tokens, passwords, auth headers, or API keys
- includes executable code or shell commands
- triggers another agent directly
- stores memory directly
- sends communication directly

## Context Rules

If required input is missing, return `context_request`.

Do not invent:
- identity details
- workflow state
- public intelligence
- analytics
- service policies
- pricing, package entitlements, implementation scope, timelines, or contract terms
- audit outputs beyond supplied or approved context
- campaign metrics
- infrastructure facts
- prior interactions

## Business Context Rules

Use `BUSINESS.md` as the canonical business context for Syntrixa.

Reject or revise output if it:
- frames Syntrixa as a rigid SaaS platform, template marketplace, generic chatbot shop, or one-time-only agency
- treats an audit request as generic contact intake without evaluating operations, workflows, systems, processes, and automation opportunities
- promises implementation after audit without contract context
- promises fixed pricing, monthly coverage, scope, timeline, or entitlement without approved context
- ignores managed monthly operations when the supplied context clearly concerns monitoring, maintenance, optimization, support, or modifications

## Memory Rules

If a durable learning should be saved, return `memory_update`.

Do not include:
- raw submissions
- raw logs
- raw email/chat bodies
- credentials
- tokens
- unsupported speculation as fact

## Handoff Rules

If another agent is needed, return `handoff`.

Do not directly invoke that agent.

n8n owns handoff persistence, context packaging, and target triggering.

## Communication Rules

If outbound delivery is needed, return `communication_request`.

Do not claim a message was sent.

n8n owns channel choice, credentials, sending, logging, retry, and delivery status.

## Human Intervention Rules

Return `human_intervention` when:
- identity, consent, authorization, or permission is unclear
- action is irreversible or sensitive
- confidence is low but action pressure is high
- legal, compliance, security, or critical incident risk appears
- raw secrets or unsafe payloads appear

## Model Route Checks

Validate `agents/model-routing.md` behavior:
- routes use env-backed references only
- no raw model keys are present
- fallback policy is explicit
- health route fails closed unless fallback is intentionally allowed
- logs contain route metadata only
