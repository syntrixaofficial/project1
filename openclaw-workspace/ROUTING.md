# Syntrixa OpenClaw Routing Matrix

Purpose: define how `syntra` routes n8n-packaged events to logical OpenClaw agents and request candidates.

Prime rule:

Routing is reasoning only. n8n owns invocation, handoff persistence, context packaging, execution, delivery, storage, and re-triggering.

## Universal Decisions

| Condition | Return |
| --- | --- |
| Missing required context | `context_request` |
| Durable sanitized learning should be saved | `memory_update` |
| External communication is needed | `communication_request` |
| Another agent is needed | `handoff` |
| Sensitive, irreversible, unsafe, or unclear action | `human_intervention` |
| Failure, retry, incident, or unsafe execution result | route or handoff to `health-monitoring-agent` |

## Request Candidate Contract

Request candidates must include:
- `id`
- `type`
- `category`
- `priority`
- `requester`
- `timestamp`
- `version`

The current P2 contract requires `version: 1.0`.

Allowed request types:
- `workflow_request`
- `communication_request`
- `context_request`
- `memory_update`
- `handoff`
- `human_intervention`

Allowed categories:
- `contact`
- `lead`
- `research`
- `helpdesk`
- `marketing`
- `health`
- `communication`
- `memory`
- `escalation`
- `infrastructure`

## Primary Event Routing

| n8n-packaged event/context | Target agent | Expected classifications | Allowed request candidates |
| --- | --- | --- | --- |
| Contact form intake completed | `lead-qualification-agent` | `continue_dialogue`, `qualified_candidate`, `reject_spam` | `workflow_request`, `communication_request`, `context_request`, `memory_update`, `handoff`, `human_intervention` |
| Audit request or planning request submitted | `lead-qualification-agent` | `audit_candidate`, `needs_more_info`, `qualified_candidate`, `escalate` | `workflow_request`, `communication_request`, `context_request`, `memory_update`, `handoff`, `human_intervention` |
| Deployment or managed AI operations opportunity | `lead-qualification-agent` | `deployment_candidate`, `audit_candidate`, `needs_more_info`, `escalate` | `workflow_request`, `communication_request`, `context_request`, `memory_update`, `handoff`, `human_intervention` |
| Lead spam/authenticity concern | `lead-qualification-agent` | `reject_spam`, `needs_more_info`, `escalate` | `workflow_request`, `memory_update`, `human_intervention` |
| Lead asks service/support question | `lead-qualification-agent`, then `handoff` to `helpdesk-agent` when needed | `handoff_ready` | `handoff`, `context_request` |
| Qualified or ambiguous lead needs company/account context | `research-agent` | `research_summary_ready`, `needs_more_info`, `handoff_ready` | `context_request`, `memory_update`, `workflow_request`, `communication_request`, `handoff` |
| Research/public intelligence context is missing | `research-agent` | `needs_more_info` | `context_request` |
| Service, FAQ, onboarding, or support question | `helpdesk-agent` | `answer_ready`, `needs_more_info`, `handoff_ready` | `communication_request`, `context_request`, `memory_update`, `handoff`, `human_intervention` |
| Campaign, funnel, growth, positioning, or sales signal | `marketing-sales-agent` | `recommendation_ready`, `needs_more_info`, `handoff_ready` | `context_request`, `memory_update`, `workflow_request`, `communication_request`, `handoff`, `human_intervention` |
| Campaign mutation or operational change request | `marketing-sales-agent`, then `syntra` validation | `recommendation_ready`, `escalate` | `workflow_request`, `human_intervention` |
| Workflow failure, retry review, incident, API status, container health, execution health | `health-monitoring-agent` | `retry_recommended`, `no_retry`, `incident_report_ready`, `escalate` | `context_request`, `memory_update`, `workflow_request`, `communication_request`, `human_intervention` |
| Critical incident | `health-monitoring-agent` or direct `human_intervention` depending on n8n critical package | `escalate` | `human_intervention`, `communication_request` |

## Handoff Routing

| Source condition | Handoff target | Reason |
| --- | --- | --- |
| Lead needs company/account intelligence | `research-agent` | research context is outside Lead Agent scope |
| Lead asks service/package/support question | `helpdesk-agent` | support answer is outside Lead Agent scope |
| Research finds sales positioning opportunity | `marketing-sales-agent` | campaign/sales reasoning is outside Research Agent scope |
| Research finds service/policy question | `helpdesk-agent` | service answer is outside Research Agent scope |
| Helpdesk detects sales/lead qualification opportunity | `lead-qualification-agent` | qualification reasoning is outside Helpdesk scope |
| Helpdesk detects incident/security concern | `health-monitoring-agent` | incident reasoning is outside Helpdesk scope |
| Helpdesk detects unclear pricing, entitlement, or contract scope | human review or `lead-qualification-agent` | pricing and scope need approved business context |
| Marketing needs account evidence | `research-agent` | research evidence is outside Marketing scope |
| Marketing detects lead qualification issue | `lead-qualification-agent` | qualification is outside Marketing scope |
| Any agent detects workflow failure or unsafe execution | `health-monitoring-agent` | recovery and incident reasoning belongs to Health |

## Escalation Rules

Return `human_intervention` when:

- identity, consent, permission, or authorization is unclear
- requested action is irreversible or sensitive
- raw secrets, credentials, tokens, or unsafe payloads appear
- confidence is low but external action is requested
- facts conflict and action cannot safely wait
- legal, compliance, security, or critical incident risk appears
- n8n package is incomplete but action pressure is high

## Context Request Rules

Return `context_request` when required input is absent.

Examples:

- Lead Agent needs prior interactions, consent, or workflow state
- Research Agent needs public intelligence package or source reliability
- Helpdesk Agent needs FAQ, service, identity, or support context
- Marketing Agent needs normalized analytics or CRM-derived signal package
- Health Agent needs trace, workflow state, monitoring package, or retry count

OpenClaw does not fetch context.

## Memory Update Rules

Return `memory_update` only for durable, sanitized, useful learnings.

Examples:

- approved spam pattern
- approved qualification criterion
- approved research/account summary
- approved FAQ improvement
- approved campaign learning
- sanitized recurring failure pattern

Do not store raw submissions, raw logs, raw email bodies, credentials, tokens, or unsupported speculation.

## Communication Rules

Return `communication_request` when outbound delivery is needed.

Agents provide:

- recipient reference
- purpose
- template hint
- safe draft/questions
- urgency

n8n selects channel, resolves credentials, sends, logs, and retries.

## Final Rule

If routing is ambiguous, `syntra` should either:

- request more context with `context_request`
- ask for human decision with `human_intervention`
- route to the narrowest safe specialist

Never invent context to force a route.
