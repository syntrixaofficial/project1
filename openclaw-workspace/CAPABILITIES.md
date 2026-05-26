# Syntrixa n8n Capability Registry

OpenClaw agents do not own tools. They emit request candidates. n8n implements capabilities.

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

## Categories

- contact
- lead
- research
- helpdesk
- marketing
- health
- communication
- memory
- escalation
- infrastructure

## Agent Capabilities

Lead Qualification: lead/contact context, prior interaction context, identity/consent context, follow-up delivery, lead updates, spam marking, handoff, sanitized memory.

Research: public intelligence package, website/account summary, signal mapping, opportunity/risk context, stored lead/account context, report storage/delivery, handoff, sanitized memory.

Helpdesk: service/FAQ context, identity/account context, prior support context, ticket/workflow update, response drafts, escalation, handoff, sanitized memory.

Marketing & Sales: analytics/package context, campaign/channel references, audience/segment context, CRM sales signals, messaging context, action proposals, handoff, sanitized memory.

Health Monitoring: failure/incident package, API status, infra/container health, execution health, retry evaluation, corrective action recommendation, escalation, sanitized memory.

## Communication

All outbound communication is n8n-owned.

Supported channel hints: email, desktop, dashboard, slack, discord, sms, ticketing.

Agents provide purpose, recipient, template, summary, questions, urgency; n8n selects channel and sends.

## Storage

n8n owns storage.

OpenClaw works with packaged context and returns request candidates only.
