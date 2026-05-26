# Syntrixa OpenClaw Schemas

Schema contracts for OpenClaw reasoning outputs. Validate before n8n execution.

## Files

- `common.schema.json` - shared enums and reusable shapes
- `context-package.schema.json` - n8n-packaged context for OpenClaw
- `request-candidate.schema.json` - OpenClaw-to-n8n request candidates
- `agent-result.schema.json` - generic agent result envelope
- `specialist-result.schema.json` - per-agent output classifications

Current OpenClaw-to-n8n request candidates require `version: "1.0"`.

## Boundary

Schemas describe reasoning I/O only.

They do not grant direct access to tools, storage, APIs, channels, Docker, monitoring, or infrastructure.
