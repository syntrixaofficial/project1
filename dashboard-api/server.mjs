import http from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const host = process.env.DASHBOARD_API_HOST || "0.0.0.0";
const port = Number(process.env.DASHBOARD_API_PORT || 8080);
const openclawBaseUrl = (process.env.OPENCLAW_BASE_URL || "http://nemoclaw:8990").replace(/\/$/, "");
const n8nIntentUrl = process.env.N8N_INTENT_WEBHOOK_URL || "http://n8n:5678/webhook/openclaw/intent/";
const stateFile = process.env.DASHBOARD_STATE_FILE || "/app/data/dashboard-state.json";
const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN || "";
const dashboardToken = process.env.DASHBOARD_INGEST_TOKEN || "";
const contractVersion = "1.0";
const stateVersion = 3;

const agentProfiles = [
  ["syntra", "Syntra Supervisor", "Syntra", "AI operations supervisor and orchestration director"],
  ["lead-qualification-agent", "Lead Qualification Agent", "Lead", "B2B lead qualifier and discovery strategist"],
  ["research-agent", "Research Agent", "Research", "Business research analyst"],
  ["helpdesk-agent", "Helpdesk Agent", "Helpdesk", "Receptionist and support coordinator"],
  ["marketing-sales-agent", "Marketing Sales Agent", "Marketing", "B2B marketing and sales strategist"],
  ["health-monitoring-agent", "Health Monitoring Agent", "Health", "AI operations reliability analyst"],
];

const allowedAgents = new Set(agentProfiles.map(([id]) => id));
const columns = ["intake", "in-progress", "waiting-approval", "automated", "done"];

function now() {
  return new Date().toISOString();
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createAgent(id, status, classification, tasks, health, lastAction) {
  const [, name, shortName, role] = agentProfiles.find(([agentId]) => agentId === id);
  return { id, name, shortName, role, status, classification, tasks, health, lastAction, updatedAt: now() };
}

function seedState() {
  const agents = [
    createAgent("syntra", "routing", "route", 18, 99, "Selected narrowest safe specialist for a packaged event"),
    createAgent("lead-qualification-agent", "qualifying", "audit_candidate", 14, 97, "Scored audit and deployment signals from intake context"),
    createAgent("research-agent", "waiting_context", "needs_more_info", 7, 96, "Requested n8n-collected public intelligence package"),
    createAgent("helpdesk-agent", "answering", "answer_ready", 11, 98, "Prepared support answer from approved service knowledge"),
    createAgent("marketing-sales-agent", "recommending", "recommendation_ready", 9, 95, "Stored campaign recommendation candidate for n8n"),
    createAgent("health-monitoring-agent", "monitoring", "incident_report_ready", 6, 94, "Summarized workflow retry safety from diagnostic package"),
  ];

  const tasks = [
    task("task-lead-audit", "Audit request for disconnected ops workflow", "lead-qualification-agent", "high", "18 min", "workflow_request", "intake", false, "Packaged by n8n intake"),
    task("task-support-scope", "Client asks if monthly support covers new workflow", "helpdesk-agent", "medium", "42 min", "context_request", "intake", true, "Policy context needed"),
    task("task-research", "Collect public intelligence for qualified agency lead", "research-agent", "medium", "1h 20m", "context_request", "in-progress", false, "Waiting on connector"),
    task("task-marketing", "Generate positioning angles from CRM intent segment", "marketing-sales-agent", "low", "2h", "workflow_request", "in-progress", false, "Recommendation ready"),
    task("task-human-price", "Ambiguous pricing response needs human decision", "helpdesk-agent", "high", "9 min", "human_intervention", "waiting-approval", true, "Human loop required"),
    task("task-critical", "Critical workflow incident recovery path", "health-monitoring-agent", "high", "4 min", "human_intervention", "waiting-approval", true, "Operator decision required"),
    task("task-followup", "Send follow-up questions to qualified lead", "lead-qualification-agent", "medium", "Done", "communication_request", "automated", false, "n8n delivery queued"),
    task("task-health-record", "Record sanitized retry incident summary", "health-monitoring-agent", "low", "Done", "memory_update", "done", false, "Stored candidate"),
  ];

  const approvals = [
    approval("approval-pricing-scope", "Clarify pricing and scope before client reply", "helpdesk-agent", "Client asks whether a significant new integration is included in managed monthly operations. Approved policy context is missing.", "Medium", "Edit response to ask for workflow scope and route pricing to a human operator.", "Helpdesk Agent recommends human review because entitlement and pricing cannot be promised without approved context.", "Approve safe clarification, edit draft, or reject outbound response.", "task-human-price"),
    approval("approval-critical-incident", "Choose recovery path for critical automation incident", "health-monitoring-agent", "n8n supplied a critical failure package with retry pressure and possible client-facing impact.", "High", "Pause automated retries and notify the operator before external communication.", "Health Monitoring Agent recommends escalation before any irreversible remediation.", "Approve escalation, edit recovery plan, or reject automated retry.", "task-critical"),
  ];

  return {
    version: stateVersion,
    createdAt: now(),
    updatedAt: now(),
    agents,
    tasks,
    approvals,
    requestCandidates: [
      candidate("workflow_request", "lead", "lead-qualification-agent", "high", "audit_intake_review", "Review packaged audit request and propose safe next step."),
      candidate("context_request", "research", "research-agent", "normal", null, "Need public intelligence package from n8n before research synthesis."),
      candidate("human_intervention", "escalation", "health-monitoring-agent", "urgent", null, "Operator must choose critical incident recovery path."),
    ],
    agentRuns: [],
    chatMessages: [
      {
        id: randomUUID(),
        role: "syntra",
        mode: "human-loop",
        createdAt: minutesAgo(6),
        summary: "I can route dashboard commands to the safest specialist path while n8n owns execution, credentials, storage, and delivery.",
        actions: [{ label: "Package context", type: "context_request" }, { label: "Human review", type: "human_intervention" }],
      },
    ],
    activity: [
      event("Syntra Supervisor", "routed packaged audit request to Lead Qualification Agent", "mint", minutesAgo(1)),
      event("Research Agent", "requested public intelligence context from n8n", "cyan", minutesAgo(3)),
      event("Health Monitoring Agent", "flagged critical retry path for human intervention", "amber", minutesAgo(7)),
      event("Marketing Sales Agent", "prepared recommendation from normalized CRM signal package", "cyan", minutesAgo(12)),
      event("Helpdesk Agent", "drafted service response from approved knowledge context", "mint", minutesAgo(16)),
    ],
  };
}

function task(id, title, agent, priority, sla, type, column, approval, status) {
  return { id, title, agent, priority, sla, type, column, approval, status, createdAt: now(), updatedAt: now() };
}

function approval(id, title, requester, context, riskLevel, suggestedAction, recommendation, decisionNeeded, taskId = null) {
  return {
    id,
    title,
    requester,
    context,
    riskLevel,
    suggestedAction,
    recommendation,
    decisionNeeded,
    taskId,
    state: "pending",
    history: [],
    createdAt: now(),
    updatedAt: now(),
  };
}

function candidate(type, category, targetAgent, priority, workflow, purpose, extra = {}) {
  return {
    id: randomUUID(),
    type,
    category,
    priority,
    requester: { id: targetAgent || "syntra", role: targetAgent === "syntra" ? "supervisor" : "agent" },
    timestamp: now(),
    version: contractVersion,
    target_agent: targetAgent,
    workflow,
    purpose,
    status: "queued",
    source: "dashboard-api",
    ...extra,
  };
}

function event(agent, message, tone = "mint", createdAt = now(), meta = {}) {
  return { id: randomUUID(), agent, message, tone, time: relativeTime(createdAt), createdAt, ...meta };
}

function relativeTime(dateString) {
  const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function loadState() {
  try {
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    if (state.version !== stateVersion) {
      const seeded = seedState();
      saveState(seeded);
      return seeded;
    }
    return { ...seedState(), ...state };
  } catch {
    const seeded = seedState();
    saveState(seeded);
    return seeded;
  }
}

function saveState(nextState = state) {
  nextState.updatedAt = now();
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(nextState, null, 2));
}

let state = loadState();
const sseClients = new Set();

function addActivity(agent, message, tone = "mint", meta = {}) {
  const item = event(agent, message, tone, now(), meta);
  state.activity = [item, ...state.activity].slice(0, 100);
  saveState();
  broadcast("activity", item);
  return item;
}

function broadcast(name, data) {
  for (const res of sseClients) {
    res.write(`event: ${name}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function corsHeaders() {
  const origin = process.env.DASHBOARD_ALLOWED_ORIGIN || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-syntrixa-dashboard-token",
  };
}

function sendJson(res, status, body, extraHeaders = {}) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    ...corsHeaders(),
    ...extraHeaders,
    "content-type": "application/json",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function collectJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 500_000) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function tokenIsConfigured(value) {
  return value && !value.startsWith("replace-with-");
}

function authorizeDashboardIngest(req) {
  if (!tokenIsConfigured(dashboardToken)) return true;
  return req.headers["x-syntrixa-dashboard-token"] === dashboardToken || req.headers.authorization === `Bearer ${dashboardToken}`;
}

async function openclawFetch(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (tokenIsConfigured(openclawToken)) headers.authorization = `Bearer ${openclawToken}`;
  const response = await fetch(`${openclawBaseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  return { status: response.status, ok: response.ok, body };
}

async function n8nFetch(payload) {
  if (!process.env.N8N_INTENT_WEBHOOK_URL) {
    return { attempted: false, ok: false, status: 0, body: { note: "N8N_INTENT_WEBHOOK_URL not configured" } };
  }
  const response = await fetch(n8nIntentUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 1000) };
  }
  return { attempted: true, ok: response.ok, status: response.status, body };
}

async function runtimeStatus() {
  try {
    const health = await openclawFetch("/openclaw/health", { method: "GET" });
    return {
      online: health.ok && health.body?.ok === true,
      service: health.body?.service || "syntrixa-openclaw-agent-invoke",
      version: health.body?.version || contractVersion,
      agents: health.body?.agents || state.agents.map((agent) => agent.id),
      checkedAt: now(),
      openclawBaseUrl,
    };
  } catch (error) {
    return {
      online: false,
      service: "syntrixa-openclaw-agent-invoke",
      version: contractVersion,
      agents: state.agents.map((agent) => agent.id),
      checkedAt: now(),
      openclawBaseUrl,
      error: error.message,
    };
  }
}

function kanbanColumns() {
  return columns.map((id) => ({
    id,
    title: {
      intake: "Intake",
      "in-progress": "In Progress",
      "waiting-approval": "Waiting Approval",
      automated: "Automated",
      done: "Done",
    }[id],
    cards: state.tasks.filter((taskItem) => taskItem.column === id),
  }));
}

function analytics() {
  const completed = state.tasks.filter((item) => item.column === "done").length;
  const automated = state.tasks.filter((item) => item.column === "automated").length;
  const approvals = state.approvals.filter((item) => item.state === "pending").length;
  return {
    automationVolume: [
      { label: "Runs", value: state.agentRuns.length || 8 },
      { label: "Tasks", value: state.tasks.length },
      { label: "Auto", value: automated + 4 },
      { label: "Done", value: completed + 2 },
    ],
    agentWorkload: state.agents.filter((agent) => agent.id !== "syntra").map((agent) => ({ label: agent.shortName, value: agent.tasks })),
    savedHours: [
      { label: "Queued", value: state.tasks.length * 4 },
      { label: "Automated", value: automated * 9 + 18 },
      { label: "Reviewed", value: approvals * 6 + 11 },
      { label: "Protected", value: state.requestCandidates.length * 5 },
    ],
    riskPrevented: [
      { label: "Context", value: countCandidates("context_request") },
      { label: "Human loop", value: countCandidates("human_intervention") + approvals },
      { label: "Handoff", value: countCandidates("handoff") },
      { label: "Retry safety", value: state.tasks.filter((item) => item.agent === "health-monitoring-agent").length + 3 },
    ],
  };
}

function countCandidates(type) {
  return state.requestCandidates.filter((item) => item.type === type).length;
}

function dashboardPayload(runtime) {
  const pendingApprovals = state.approvals.filter((item) => item.state === "pending").length;
  const automatedTasks = state.tasks.filter((item) => ["automated", "done"].includes(item.column)).length;
  return {
    ok: true,
    generatedAt: now(),
    runtime,
    kpis: [
      { id: "automated", label: "Tasks automated", value: automatedTasks + 128, trend: `${state.agentRuns.length} live runs`, icon: "workflow" },
      { id: "agents", label: "Agents active", value: state.agents.length, trend: runtime.online ? "OpenClaw online" : "offline fallback", icon: "bot" },
      { id: "approvals", label: "Human approval queue", value: pendingApprovals, trend: `${state.approvals.length} total`, icon: "shield-check" },
      { id: "context", label: "Request candidates", value: state.requestCandidates.length, trend: "n8n owned", icon: "database" },
      { id: "saved", label: "Hours saved", value: Math.max(73, automatedTasks * 9), trend: "+14 this week", icon: "clock" },
    ],
    core: {
      title: "Syntrixa Core",
      subtitle: "Syntra supervisor coordinating n8n-packaged agent reasoning through OpenClaw",
      supervisor: state.agents.find((agent) => agent.id === "syntra"),
      connectedAgents: state.agents.filter((agent) => agent.id !== "syntra"),
      rules: ["OpenClaw reasons only", "n8n executes external actions", "Dashboard consumes sanitized API data"],
    },
    agents: state.agents,
    kanbanColumns: kanbanColumns(),
    approvals: state.approvals,
    requestCandidates: state.requestCandidates,
    agentRuns: state.agentRuns.slice(0, 25),
    chatMessages: state.chatMessages.slice(-25),
    analytics: analytics(),
    activity: state.activity.map((item) => ({ ...item, time: relativeTime(item.createdAt) })).slice(0, 25),
  };
}

function inferAgent(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("lead") || text.includes("audit") || text.includes("discovery")) return "lead-qualification-agent";
  if (text.includes("research") || text.includes("public intelligence") || text.includes("company")) return "research-agent";
  if (text.includes("support") || text.includes("helpdesk") || text.includes("pricing") || text.includes("scope")) return "helpdesk-agent";
  if (text.includes("campaign") || text.includes("marketing") || text.includes("sales")) return "marketing-sales-agent";
  if (text.includes("health") || text.includes("incident") || text.includes("retry") || text.includes("failure")) return "health-monitoring-agent";
  return "syntra";
}

function inferCategory(message, targetAgent) {
  const text = String(message || "").toLowerCase();
  if (targetAgent === "marketing-sales-agent" || text.includes("campaign") || text.includes("marketing") || text.includes("sales") || text.includes("social") || text.includes("content")) return "marketing";
  if (targetAgent === "lead-qualification-agent" || text.includes("lead") || text.includes("audit") || text.includes("discovery")) return "lead";
  if (targetAgent === "research-agent" || text.includes("research") || text.includes("public intelligence") || text.includes("company")) return "research";
  if (targetAgent === "helpdesk-agent" || text.includes("support") || text.includes("helpdesk") || text.includes("pricing") || text.includes("scope")) return "helpdesk";
  if (targetAgent === "health-monitoring-agent" || text.includes("health") || text.includes("incident") || text.includes("retry") || text.includes("failure")) return "health";
  return "escalation";
}

function chatPrompt(message, mode, targetAgent) {
  return {
    target_agent: targetAgent,
    event_type: "dashboard_supervisor_chat",
    priority: mode === "autopilot" ? "high" : "normal",
    context_package: {
      package_id: randomUUID(),
      source_workflow: "syntrixa_dashboard_chat",
      subject_refs: { workflow_id: "dashboard-supervisor-chat", trace_id: randomUUID() },
      constraints: { minimal_context: true, no_raw_secrets: true },
      dashboard_context: {
        mode,
        human_message: String(message || "").slice(0, 2000),
        allowed_actions: ["route_to_specialist", "request_context", "create_human_intervention_candidate", "summarize_safe_next_step"],
      },
    },
  };
}

function structuredChatResponse(message, mode, targetAgent, openclawResult = null) {
  const result = openclawResult?.result || openclawResult?.body?.result || openclawResult;
  const classification = result?.classification || (targetAgent === "syntra" ? "route" : "request_packaged_context");
  const candidates = result?.n8n_request_candidates || [];
  const targetName = state.agents.find((agent) => agent.id === targetAgent)?.name || "Syntra Supervisor";
  const safeActions = candidates.length
    ? candidates.map((item) => humanizeCandidate(item))
    : [
        "Package minimal context through n8n",
        targetAgent === "syntra" ? "Route to the narrowest safe specialist" : `Route to ${targetName}`,
        mode === "autopilot" ? "Queue n8n execution only after policy checks" : "Keep human review available before execution",
      ];
  return {
    id: randomUUID(),
    role: "syntra",
    mode,
    createdAt: now(),
    classification,
    targetAgent,
    summary: `Syntra ${classification === "route" ? "routed" : "reviewed"} this command for ${targetName}. OpenClaw remains reasoning-only; n8n owns execution and the dashboard records the operator-visible control state.`,
    safeActions,
    actions: safeActions.map((label, index) => ({ label, type: candidates[index]?.type || "dashboard_action" })),
    openclawResult,
  };
}

function chatExecutionCandidate(message, mode, targetAgent) {
  const category = inferCategory(message, targetAgent);
  const type = mode === "review-only" ? "human_intervention" : category === "marketing" ? "workflow_request" : "context_request";
  return candidate(
    type,
    category,
    targetAgent,
    mode === "autopilot" ? "high" : "normal",
    category === "marketing" ? "dashboard_marketing_campaign_request" : "dashboard_chat_execution",
    String(message || "").slice(0, 500),
    {
      source: "dashboard-chat",
      mode,
      payload: {
        human_message: String(message || "").slice(0, 2000),
        requested_live_execution: true,
        dashboard_mode: mode,
        target_agent: targetAgent,
      },
    },
  );
}

function humanizeCandidate(item) {
  const type = String(item.type || "request").replaceAll("_", " ");
  const agent = item.target_agent || item.requester?.id || "syntra";
  return `${type}: ${item.purpose || item.decision_needed || item.workflow || `route through ${agent}`}`;
}

function recordOpenClawResult(source, response, targetAgent) {
  const result = response?.body?.result || response?.result;
  const run = {
    id: randomUUID(),
    source,
    targetAgent,
    ok: Boolean(response?.ok),
    status: response?.status || 200,
    result: sanitizeOpenClawResult(result),
    createdAt: now(),
  };
  state.agentRuns = [run, ...state.agentRuns].slice(0, 100);
  if (result?.agent) {
    const agent = state.agents.find((item) => item.id === result.agent);
    if (agent) {
      agent.classification = result.classification || agent.classification;
      agent.status = statusFromClassification(agent.classification);
      agent.tasks += 1;
      agent.lastAction = result.summary || `Returned ${agent.classification}`;
      agent.updatedAt = now();
    }
  }
  for (const raw of result?.n8n_request_candidates || []) {
    const item = sanitizeCandidate(raw);
    if (!state.requestCandidates.some((candidateItem) => candidateItem.id === item.id)) {
      state.requestCandidates.unshift(item);
      state.tasks.unshift(taskFromCandidate(item));
      if (item.type === "human_intervention") state.approvals.unshift(approvalFromCandidate(item));
    }
  }
  saveState();
  return run;
}

function sanitizeOpenClawResult(result = {}) {
  if (!result || typeof result !== "object") return null;
  return {
    type: result.type,
    agent: result.agent,
    event_type: result.event_type,
    classification: result.classification,
    confidence: result.confidence,
    summary: result.summary,
    context_package_used: result.context_package_used,
    facts: result.facts || [],
    inferences: result.inferences || [],
    unknowns: result.unknowns || [],
    missing_fields: result.missing_fields || [],
    recommended_next_steps: result.recommended_next_steps || [],
    handoff: result.handoff,
    n8n_request_candidates: (result.n8n_request_candidates || []).map(sanitizeCandidate),
  };
}

function sanitizeCandidate(raw = {}) {
  return {
    id: raw.id || randomUUID(),
    type: raw.type || "workflow_request",
    category: raw.category || "escalation",
    priority: raw.priority || "normal",
    requester: raw.requester || { id: raw.target_agent || "syntra", role: "agent" },
    timestamp: raw.timestamp || now(),
    version: raw.version || contractVersion,
    workflow: raw.workflow || null,
    target_agent: raw.target_agent || raw.requester?.id || "syntra",
    purpose: raw.purpose || raw.reason || raw.context_summary || null,
    required_scopes: raw.required_scopes || [],
    decision_needed: raw.decision_needed || null,
    status: raw.status || "queued",
    subject_refs: raw.subject_refs || {},
  };
}

function statusFromClassification(classification) {
  if (classification?.includes("needs_more")) return "waiting_context";
  if (classification?.includes("escalate")) return "escalating";
  if (classification?.includes("ready")) return "ready";
  if (classification?.includes("route")) return "routing";
  return "reasoning";
}

function taskFromCandidate(item) {
  const column = item.type === "human_intervention" ? "waiting-approval" : item.type === "workflow_request" ? "intake" : "in-progress";
  return task(
    `task-${item.id}`,
    item.purpose || item.decision_needed || item.workflow || `${item.type.replaceAll("_", " ")} from ${item.target_agent}`,
    item.target_agent || item.requester?.id || "syntra",
    item.priority === "urgent" ? "high" : item.priority === "low" ? "low" : "medium",
    item.priority === "urgent" ? "5 min" : "45 min",
    item.type,
    column,
    item.type === "human_intervention",
    item.status || "Queued from request candidate",
  );
}

function approvalFromCandidate(item) {
  return approval(
    `approval-${item.id}`,
    item.decision_needed || item.purpose || "Human decision required",
    item.target_agent || item.requester?.id || "syntra",
    item.purpose || item.reason || "OpenClaw requested human intervention before n8n execution.",
    item.priority === "urgent" ? "High" : "Medium",
    "Review the request candidate and choose the safest operator-visible next step.",
    `${item.requester?.id || "Syntra"} recommends human review before execution.`,
    item.decision_needed || "Approve, edit, or reject this candidate.",
    `task-${item.id}`,
  );
}

async function handleChat(req, res) {
  const body = await collectJson(req);
  const message = String(body.message || "").trim();
  const mode = body.mode || "human-loop";
  const targetAgent = body.targetAgent && allowedAgents.has(body.targetAgent) ? body.targetAgent : inferAgent(message);
  const humanMessage = { id: randomUUID(), role: "human", mode, createdAt: now(), summary: message };
  state.chatMessages.push(humanMessage);

  let openclaw = null;
  let n8n = { attempted: false, ok: false, status: 0, body: { note: "not attempted" } };
  let degraded = false;
  try {
    const response = await openclawFetch("/openclaw/agent/invoke", {
      method: "POST",
      body: JSON.stringify(chatPrompt(message, mode, targetAgent)),
    });
    openclaw = response.body;
    if (response.ok) recordOpenClawResult("dashboard_chat", response, targetAgent);
    degraded = !response.ok;
  } catch (error) {
    degraded = true;
    openclaw = { ok: false, errors: [error.message] };
  }

  const requestCandidate = chatExecutionCandidate(message, mode, targetAgent);
  state.requestCandidates.unshift(requestCandidate);
  state.tasks.unshift(taskFromCandidate(requestCandidate));
  if (requestCandidate.type === "human_intervention") state.approvals.unshift(approvalFromCandidate(requestCandidate));
  try {
    n8n = await n8nFetch(requestCandidate);
    addActivity(
      "n8n",
      `${n8n.ok ? "executed" : "failed"} live chat workflow for ${inferCategory(message, targetAgent)} via ${targetAgent}`,
      n8n.ok ? "cyan" : "amber",
      { source: "dashboard-chat", status: n8n.status },
    );
  } catch (error) {
    degraded = true;
    n8n = { attempted: true, ok: false, status: 0, body: { error: error.message } };
    addActivity("n8n", `failed live chat workflow for ${targetAgent}: ${error.message}`, "amber", { source: "dashboard-chat" });
  }

  const reply = structuredChatResponse(message, mode, targetAgent, openclaw);
  reply.n8n = { ok: n8n.ok, status: n8n.status, attempted: n8n.attempted };
  reply.requestCandidate = requestCandidate;
  state.chatMessages.push(reply);
  addActivity("Syntra Supervisor", `${degraded || !n8n.ok ? "queued review for" : "processed and executed"} dashboard command through ${targetAgent}`, degraded || !n8n.ok ? "amber" : "mint");
  saveState();
  return sendJson(res, 200, { ok: true, degraded: degraded || !n8n.ok, message: reply, openclaw, n8n, requestCandidate });
}

async function handleAgentInvoke(req, res) {
  const body = await collectJson(req);
  const targetAgent = body.target_agent || body.targetAgent || inferAgent(body.message || body.event_type);
  if (!allowedAgents.has(targetAgent)) return sendJson(res, 422, { ok: false, errors: ["unsupported target agent"] });
  const payload = {
    target_agent: targetAgent,
    event_type: body.event_type || "dashboard_agent_invoke",
    priority: body.priority || "normal",
    context_package: {
      package_id: randomUUID(),
      source_workflow: "syntrixa_dashboard_agent_invoke",
      subject_refs: { workflow_id: body.workflow_id || "dashboard", trace_id: randomUUID(), ...(body.subject_refs || {}) },
      constraints: { minimal_context: true, no_raw_secrets: true },
      dashboard_context: body.context || { message: body.message || "" },
    },
  };

  const response = await openclawFetch("/openclaw/agent/invoke", { method: "POST", body: JSON.stringify(payload) });
  const run = recordOpenClawResult("dashboard_agent_invoke", response, targetAgent);
  addActivity(state.agents.find((agent) => agent.id === targetAgent)?.name || targetAgent, `returned ${run.result?.classification || "agent result"} to dashboard`, response.ok ? "cyan" : "amber");
  return sendJson(res, response.ok ? 200 : response.status, { ...response.body, run });
}

async function handleWorkflowCreate(req, res) {
  const body = await collectJson(req);
  const targetAgent = body.targetAgent || inferAgent(body.title || body.description || "");
  const item = task(
    `task-${randomUUID()}`,
    String(body.title || "New dashboard workflow request").slice(0, 160),
    targetAgent,
    body.priority || "medium",
    body.sla || "45 min",
    "workflow_request",
    "intake",
    body.requiresApproval === true,
    "Created from dashboard",
  );
  state.tasks.unshift(item);
  const requestCandidate = candidate("workflow_request", body.category || "lead", targetAgent, item.priority === "high" ? "high" : "normal", body.workflow || "dashboard_created_workflow", body.description || item.title, { task_id: item.id });
  state.requestCandidates.unshift(requestCandidate);
  addActivity("Syntra Supervisor", `created workflow control card for ${state.agents.find((agent) => agent.id === targetAgent)?.shortName || targetAgent}`, "mint");

  const n8n = await n8nFetch(requestCandidate).catch((error) => ({ attempted: true, ok: false, status: 0, body: { error: error.message } }));
  saveState();
  return sendJson(res, 201, { ok: true, task: item, requestCandidate, n8n });
}

async function handleApprovalDecision(req, res, approvalId, decision) {
  const body = await collectJson(req);
  const item = state.approvals.find((approvalItem) => approvalItem.id === approvalId);
  if (!item) return sendJson(res, 404, { ok: false, errors: ["approval not found"] });
  if (!["approve", "edit", "reject"].includes(decision)) return sendJson(res, 422, { ok: false, errors: ["invalid approval decision"] });

  item.state = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "edited";
  item.updatedAt = now();
  item.history.push({ id: randomUUID(), decision, note: body.note || "", at: now(), operator: body.operator || "dashboard-user" });

  const linkedTask = state.tasks.find((taskItem) => taskItem.id === item.taskId);
  if (linkedTask) {
    linkedTask.column = decision === "approve" ? "automated" : decision === "reject" ? "done" : "waiting-approval";
    linkedTask.status = decision === "approve" ? "Approved for n8n execution" : decision === "reject" ? "Rejected by human operator" : "Edited by human operator";
    linkedTask.updatedAt = now();
  }

  const payload = {
    id: randomUUID(),
    type: decision === "approve" ? "workflow_request" : "human_intervention",
    category: "escalation",
    priority: item.riskLevel === "High" ? "urgent" : "normal",
    requester: { id: "dashboard", role: "human_operator" },
    timestamp: now(),
    version: contractVersion,
    approval_id: item.id,
    decision,
    decision_needed: item.decisionNeeded,
    context_summary: item.context,
  };
  const n8n = await n8nFetch(payload).catch((error) => ({ attempted: true, ok: false, status: 0, body: { error: error.message } }));
  addActivity("Human Operator", `${decision}d approval: ${item.title}`, decision === "reject" ? "amber" : "mint");
  saveState();
  return sendJson(res, 200, { ok: true, approval: item, task: linkedTask || null, n8n });
}

async function handleMoveTask(req, res, taskId) {
  const body = await collectJson(req);
  const column = body.column || body.toColumn;
  if (!columns.includes(column)) return sendJson(res, 422, { ok: false, errors: ["invalid kanban column"] });
  const item = state.tasks.find((taskItem) => taskItem.id === taskId);
  if (!item) return sendJson(res, 404, { ok: false, errors: ["task not found"] });
  item.column = column;
  item.status = body.status || `Moved to ${column}`;
  item.updatedAt = now();
  addActivity("Dashboard", `moved "${item.title}" to ${column}`, "cyan");
  saveState();
  return sendJson(res, 200, { ok: true, task: item });
}

async function handleN8nIngest(req, res, kind) {
  if (!authorizeDashboardIngest(req)) return sendJson(res, 401, { ok: false, errors: ["unauthorized"] });
  const body = await collectJson(req);

  if (kind === "request-candidates") {
    const rawItems = Array.isArray(body.items) ? body.items : Array.isArray(body.n8n_request_candidates) ? body.n8n_request_candidates : [body];
    const items = rawItems.map(sanitizeCandidate);
    for (const item of items) {
      if (!state.requestCandidates.some((candidateItem) => candidateItem.id === item.id)) {
        state.requestCandidates.unshift(item);
        state.tasks.unshift(taskFromCandidate(item));
        if (item.type === "human_intervention") state.approvals.unshift(approvalFromCandidate(item));
      }
    }
    addActivity("n8n", `published ${items.length} request candidate${items.length === 1 ? "" : "s"} to dashboard`, "cyan");
    saveState();
    return sendJson(res, 202, { ok: true, accepted: items.length });
  }

  const item = event(body.agent || "n8n", body.message || body.summary || "sent dashboard event", body.tone || "cyan", body.createdAt || now(), { source: "n8n" });
  state.activity.unshift(item);
  saveState();
  broadcast("activity", item);
  return sendJson(res, 202, { ok: true, event: item });
}

function handleEvents(req, res) {
  res.writeHead(200, {
    ...corsHeaders(),
    "content-type": "text/event-stream",
    "cache-control": "no-store",
    connection: "keep-alive",
  });
  sseClients.add(res);
  res.write(`event: activity\n`);
  res.write(`data: ${JSON.stringify(state.activity[0] || event("Dashboard", "activity stream connected"))}\n\n`);
  req.on("close", () => sseClients.delete(res));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, service: "syntrixa-dashboard-api", openclawBaseUrl, n8nIntentConfigured: Boolean(process.env.N8N_INTENT_WEBHOOK_URL) });
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") return sendJson(res, 200, dashboardPayload(await runtimeStatus()));
    if (req.method === "GET" && url.pathname === "/api/openclaw/health") return sendJson(res, 200, await runtimeStatus());
    if (req.method === "GET" && url.pathname === "/api/events") return handleEvents(req, res);
    if (req.method === "GET" && url.pathname === "/api/activity") return sendJson(res, 200, { ok: true, activity: state.activity });
    if (req.method === "GET" && url.pathname === "/api/request-candidates") return sendJson(res, 200, { ok: true, requestCandidates: state.requestCandidates });
    if (req.method === "GET" && url.pathname === "/api/agents") return sendJson(res, 200, { ok: true, agents: state.agents });
    if (req.method === "GET" && url.pathname === "/api/approvals") return sendJson(res, 200, { ok: true, approvals: state.approvals });

    if (req.method === "POST" && url.pathname === "/api/chat") return await handleChat(req, res);
    if (req.method === "POST" && url.pathname === "/api/agents/invoke") return await handleAgentInvoke(req, res);
    if (req.method === "POST" && url.pathname === "/api/workflows") return await handleWorkflowCreate(req, res);
    if (req.method === "POST" && url.pathname === "/api/openclaw/invoke") return await handleAgentInvoke(req, res);
    if (req.method === "POST" && url.pathname === "/api/n8n/events") return await handleN8nIngest(req, res, "events");
    if (req.method === "POST" && url.pathname === "/api/n8n/request-candidates") return await handleN8nIngest(req, res, "request-candidates");

    const approvalMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/(approve|edit|reject)$/);
    if (req.method === "POST" && approvalMatch) return await handleApprovalDecision(req, res, approvalMatch[1], approvalMatch[2]);

    const moveMatch = url.pathname.match(/^\/api\/kanban\/([^/]+)\/move$/);
    if (req.method === "POST" && moveMatch) return await handleMoveTask(req, res, moveMatch[1]);

    return sendJson(res, 404, { ok: false, errors: ["not found"] });
  } catch (error) {
    return sendJson(res, 500, { ok: false, errors: [error.message] });
  }
});

server.listen(port, host, () => {
  console.log(`Syntrixa dashboard API listening on ${host}:${port}`);
  console.log(`OpenClaw upstream: ${openclawBaseUrl}`);
});
