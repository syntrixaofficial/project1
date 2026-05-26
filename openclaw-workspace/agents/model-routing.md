# Agent Model Routing

Purpose: define environment-backed model route names for OpenClaw agents without exposing secrets or giving agents authentication authority.

## Rule

Agents do not choose providers at runtime.

Agents do not authenticate models.

Agents do not emit API keys, model keys, provider credentials, or raw endpoint secrets.

The OpenClaw runtime resolves model routes from environment-backed SecretRefs.

## Shared Fallback Route

Shared local/default route:

- provider: `env:NEMOCLAW_PROVIDER`
- model: `env:NEMOCLAW_MODEL`
- endpoint: `env:NEMOCLAW_ENDPOINT_URL`
- api key SecretRef: `env:COMPATIBLE_API_KEY`

The shared route may be used only when policy allows fallback for that agent.

## Agent Routes

| Agent | Provider | Model | Endpoint | API key SecretRef |
| --- | --- | --- | --- | --- |
| `syntra` | `env:SYNTRA_MODEL_PROVIDER` | `env:SYNTRA_MODEL_NAME` | `env:SYNTRA_MODEL_ENDPOINT_URL` | `env:SYNTRA_MODEL_API_KEY` |
| `lead-qualification-agent` | `env:LEAD_QUALIFICATION_MODEL_PROVIDER` | `env:LEAD_QUALIFICATION_MODEL_NAME` | `env:LEAD_QUALIFICATION_MODEL_ENDPOINT_URL` | `env:LEAD_QUALIFICATION_MODEL_API_KEY` |
| `research-agent` | `env:RESEARCH_MODEL_PROVIDER` | `env:RESEARCH_MODEL_NAME` | `env:RESEARCH_MODEL_ENDPOINT_URL` | `env:RESEARCH_MODEL_API_KEY` |
| `helpdesk-agent` | `env:HELPDESK_MODEL_PROVIDER` | `env:HELPDESK_MODEL_NAME` | `env:HELPDESK_MODEL_ENDPOINT_URL` | `env:HELPDESK_MODEL_API_KEY` |
| `marketing-sales-agent` | `env:MARKETING_SALES_MODEL_PROVIDER` | `env:MARKETING_SALES_MODEL_NAME` | `env:MARKETING_SALES_MODEL_ENDPOINT_URL` | `env:MARKETING_SALES_MODEL_API_KEY` |
| `health-monitoring-agent` | `env:HEALTH_MONITORING_MODEL_PROVIDER` | `env:HEALTH_MONITORING_MODEL_NAME` | `env:HEALTH_MONITORING_MODEL_ENDPOINT_URL` | `env:HEALTH_MONITORING_MODEL_API_KEY` |

## Fallback Policy

| Agent | Shared fallback allowed | Reason |
| --- | --- | --- |
| `syntra` | yes, local only | supervisor must remain available during local setup |
| `lead-qualification-agent` | yes | low-risk reasoning if context is sanitized |
| `research-agent` | yes | research uses n8n-packaged context only |
| `helpdesk-agent` | yes | answers are constrained by supplied knowledge context |
| `marketing-sales-agent` | yes | operational changes still require n8n/syntra validation |
| `health-monitoring-agent` | no by default | incident reasoning should fail closed if route is incomplete |

Production may set fallback to false for any agent.

## Runtime Selection

Before invoking an agent, runtime should:

1. resolve the agent id
2. read the dedicated route env refs
3. use the dedicated route only when provider, model, endpoint, and SecretRef are complete
4. use shared fallback only when allowed
5. fail closed when route is incomplete and fallback is not allowed
6. log route metadata only: agent id, provider name, model name, route selected

## Security

Never store or emit:

- raw API keys
- bearer tokens
- passwords
- provider credentials
- secret values
- raw auth headers

Allowed in configs and logs:

- env var names
- SecretRef names
- provider name
- model name
- route id

No model route may bypass NemoClaw/OpenShell isolation.
