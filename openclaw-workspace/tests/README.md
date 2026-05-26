# Syntrixa OpenClaw Smoke Tests

Purpose: sample P1 test fixtures for evaluating OpenClaw reasoning behavior before n8n integration is fully implemented.

These are provisional behavioral fixtures, not final schema-compliance fixtures. Full expected `agent_result` fixtures should be generated after P2 finalizes n8n context packages.

These fixtures test that OpenClaw:

- consumes only n8n-packaged context
- returns schema-shaped `agent_result`
- emits `context_request` when context is missing
- emits `memory_update` instead of storing memory
- emits `handoff` instead of triggering another agent directly
- emits `communication_request` instead of sending messages
- never claims n8n execution occurred

## Files

- `lead-form-submission.input.json`
- `lead-form-submission.expected.json`
- `spam-lead.input.json`
- `spam-lead.expected.json`
- `lead-service-question.input.json`
- `lead-service-question.expected.json`
- `research-public-intelligence-needed.input.json`
- `research-public-intelligence-needed.expected.json`
- `helpdesk-support-question.input.json`
- `helpdesk-support-question.expected.json`
- `marketing-analysis.input.json`
- `marketing-analysis.expected.json`
- `workflow-failure.input.json`
- `workflow-failure.expected.json`
- `critical-incident.input.json`
- `critical-incident.expected.json`

## Manual Smoke Test Method

For each `.input.json`:

1. Invoke the runtime wrapper or target agent with the packaged context.
2. Confirm the output matches the paired `.expected.json` shape.
3. Validate request candidates against `../schemas/request-candidate.schema.json`.
4. Validate agent result against `../schemas/specialist-result.schema.json`.

These are contract fixtures, not live execution tests.

Container fixture command:

```sh
node /usr/local/bin/agent-invoke-server.mjs --fixture /workspace/openclaw-workspace/tests/lead-form-submission.input.json
```
