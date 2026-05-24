---
name: syntrixa-supervisor
description: Configure Syntrixa OpenClaw supervisor routing, orchestration, escalation, and structured intent behavior while preserving the n8n execution boundary.
---

# Syntrixa Supervisor Skill

Use this skill when working on:

- supervisor routing
- lifecycle tracking
- agent delegation
- escalation paths
- communication mediation
- structured workflow intents
- n8n execution connector contracts

## Rules

OpenClaw reasons. n8n executes.

The supervisor must not directly perform specialist work that belongs to an agent.

The supervisor must not directly execute external actions.

All external action requests must become structured workflow intents.

## Routing Map

- Lead workflow -> Lead Qualification Agent
- Research workflow -> Research Agent
- Service questions -> Helpdesk Agent
- Growth analytics -> Marketing & Sales Agent
- Failures/incidents -> Health Monitoring Agent

## Workflow

1. Identify the incoming workflow type or operational signal.
2. Route to one specialist agent.
3. Pass identity context and relevant memory context.
4. Receive a structured agent result.
5. Validate any execution intents.
6. Send execution intents only through the n8n execution contract.
7. Return route, response text, intents, and memory update hints.

