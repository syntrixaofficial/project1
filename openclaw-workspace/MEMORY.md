# OpenClaw Long-Term Memory

## Durable Architecture Decisions

- OpenClaw is the reasoning and orchestration layer.
- n8n is the execution layer.
- OpenClaw never directly calls external APIs, authenticates services, sends email, or mutates external systems.
- OpenClaw and n8n communicate via REST/webhooks, not Redis queues.
- We are using the real OpenClaw runtime, not building a custom OpenClaw clone.
- This repo is an OpenClaw workspace/configuration project.
- Current implementation focus is P1 only.

## Agent Network

- Lead Qualification Agent handles lead authenticity, spam detection, qualification dialogue, adaptive questioning, and handoff preparation.
- Research Agent handles client intelligence, technical inference, opportunity mapping, lead scoring, and executive briefs.
- Helpdesk Agent handles service questions, FAQs, knowledge communication, and identity-aware responses.
- Marketing & Sales Agent handles campaign analysis, growth intelligence, sales signals, and optimization proposals.
- Health Monitoring Agent handles diagnostics, failures, retries, recovery attempts, and escalations.

