import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const host = process.env.OPENCLAW_INVOKE_HOST || "0.0.0.0";
const port = Number(process.env.OPENCLAW_INVOKE_PORT || process.env.NEMOCLAW_GATEWAY_PORT || 8990);
const workspaceDir = process.env.OPENCLAW_WORKSPACE_DIR || "/workspace/openclaw-workspace";
const contractVersion = "1.0";

const agents = new Set([
  "syntra",
  "lead-qualification-agent",
  "research-agent",
  "helpdesk-agent",
  "marketing-sales-agent",
  "health-monitoring-agent",
]);

const categories = new Set([
  "contact",
  "lead",
  "research",
  "helpdesk",
  "marketing",
  "health",
  "communication",
  "memory",
  "escalation",
  "infrastructure",
]);

const requestTypes = new Set([
  "workflow_request",
  "communication_request",
  "context_request",
  "memory_update",
  "handoff",
  "human_intervention",
]);

const businessContext = {
  company: "Syntrixa",
  role: "managed AI operations, automation, and orchestration partner",
  primaryCustomers: ["small non-core tech businesses", "small agencies", "ecommerce product companies"],
  engagementModel: ["lead", "discovery", "audit_or_planning", "contract", "build", "deploy", "managed_monthly_operations"],
};

const roleContexts = {
  syntra: "experienced AI operations supervisor and agent-orchestration director",
  "lead-qualification-agent": "experienced B2B lead qualifier and discovery strategist",
  "research-agent": "experienced business research analyst",
  "helpdesk-agent": "experienced helpdesk receptionist and client support coordinator",
  "marketing-sales-agent": "experienced B2B marketing and sales strategist",
  "health-monitoring-agent": "experienced AI operations reliability analyst",
};

function sendJson(res, status, body) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function sendNoStoreJson(res, status, body) {
  const data = JSON.stringify(body, null, 2);
  res.writeHead(status, {
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
      if (raw.length > 1_000_000) {
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

function tokenIsConfigured() {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";
  return token && !token.startsWith("replace-with-");
}

function authorize(req) {
  if (!tokenIsConfigured()) {
    return true;
  }
  const expected = `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`;
  return req.headers.authorization === expected;
}

function now() {
  return new Date().toISOString();
}

function requester(agent) {
  return {
    id: agent,
    role: agent === "syntra" ? "supervisor" : "agent",
  };
}

function baseCandidate(agent, type, category, priority = "normal") {
  return {
    id: randomUUID(),
    type,
    category,
    priority,
    requester: requester(agent),
    timestamp: now(),
    version: contractVersion,
  };
}

function contextRequest(agent, category, purpose, requiredScopes) {
  return {
    ...baseCandidate(agent, "context_request", category),
    purpose,
    required_scopes: requiredScopes,
    constraints: {
      minimal_context: true,
      no_raw_secrets: true,
    },
  };
}

function communicationRequest(agent, purpose, recipientRef, body, channelHint = "email") {
  return {
    ...baseCandidate(agent, "communication_request", "communication"),
    channel_hint: channelHint,
    payload: {
      purpose,
      recipient_ref: recipientRef,
      body,
      context_summary: body,
    },
  };
}

function workflowRequest(agent, category, workflow, payload, priority = "normal") {
  return {
    ...baseCandidate(agent, "workflow_request", category, priority),
    workflow,
    payload,
    requires_human_confirmation: false,
  };
}

function handoffRequest(agent, targetAgent, reason, contextSummary, priority = "normal") {
  return {
    ...baseCandidate(agent, "handoff", "escalation", priority),
    target_agent: targetAgent,
    reason,
    context_summary: contextSummary,
  };
}

function humanIntervention(agent, reason, decisionNeeded, priority = "urgent") {
  return {
    ...baseCandidate(agent, "human_intervention", "escalation", priority),
    reason,
    decision_needed: decisionNeeded,
    recommended_options: ["approve safe next step", "request more context", "stop workflow"],
  };
}

function safeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.slice(0, 8000);
}

function combinedLeadText(ctx) {
  return safeText([
    ctx.lead?.service_interest,
    ctx.lead?.message,
    ctx.lead?.workflow_description,
    ctx.lead?.automation_goals,
    ctx.audit_request?.summary,
    ctx.audit_request?.workflow_description,
    ctx.consultation?.summary,
  ].filter(Boolean).join(" ")).toLowerCase();
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function leadSignals(ctx) {
  const text = combinedLeadText(ctx);
  const signals = [];
  if (hasAny(text, ["workflow", "process", "manual", "repetitive", "operations", "handoff"])) {
    signals.push("workflow_or_operations_pain");
  }
  if (hasAny(text, ["agent", "ai", "automation", "automate", "copilot"])) {
    signals.push("ai_automation_interest");
  }
  if (hasAny(text, ["multi-agent", "orchestration", "route", "routing", "integrate", "integration", "pipeline"])) {
    signals.push("orchestration_or_integration_signal");
  }
  if (hasAny(text, ["audit", "assessment", "evaluate", "planning", "feasibility", "map"])) {
    signals.push("audit_or_planning_intent");
  }
  if (hasAny(text, ["monitor", "maintenance", "support", "monthly", "manage", "managed"])) {
    signals.push("managed_operations_interest");
  }
  return signals;
}

function context(body) {
  return body.context_package || body.context?.context_package || {};
}

function packageUsed(ctx) {
  return {
    package_id: ctx.package_id || null,
    source_workflow: ctx.source_workflow || null,
  };
}

function subjectRefs(ctx) {
  return ctx.subject_refs || {
    lead_id: ctx.lead?.lead_id || null,
    contact_id: ctx.contact?.contact_id || null,
    account_id: ctx.account?.account_id || null,
    workflow_id: ctx.workflow_state?.workflow_id || null,
    trace_id: ctx.trace_refs?.[0] || null,
    campaign_id: ctx.analytics_context?.campaign_id || null,
    incident_id: ctx.failure_context?.incident_id || null,
  };
}

function baseResult(agent, body, classification, confidence, candidates) {
  const ctx = context(body);
  return {
    type: "agent_result",
    agent,
    role_context: roleContexts[agent],
    business_context: businessContext,
    event_type: body.event_type || "unspecified_event",
    classification,
    confidence,
    summary: "",
    context_package_used: packageUsed(ctx),
    facts: [],
    inferences: [],
    unknowns: [],
    assumptions: [],
    signals: [],
    missing_fields: [],
    recommended_next_steps: [],
    handoff: {
      ready: false,
      target_agent: null,
      reason: null,
      context_summary: null,
    },
    n8n_request_candidates: candidates.map((candidate) => ({
      subject_refs: subjectRefs(ctx),
      ...candidate,
    })),
    runtime: {
      adapter: "syntrixa-openclaw-agent-invoke",
      mode: "contract_adapter",
      workspace_dir: workspaceDir,
    },
  };
}

function leadResult(body) {
  const ctx = context(body);
  const message = combinedLeadText(ctx);
  const contactRef = ctx.contact?.contact_id || ctx.subject_refs?.contact_id || "unknown_contact";
  const candidates = [];
  let classification = "continue_dialogue";
  let confidence = "medium";
  const signals = leadSignals(ctx);
  const asksServiceQuestion = hasAny(message, ["package", "pricing", "price", "cost", "dashboard", "support", "maintenance", "monthly", "service"]);

  if (hasAny(message, ["spam", "crypto giveaway", "casino backlinks", "buy now!!!"])) {
    classification = "reject_spam";
    confidence = "high";
    candidates.push(workflowRequest("lead-qualification-agent", "lead", "mark_lead_spam", {
      reason: "lead content matched spam indicators",
    }));
  } else if (asksServiceQuestion && !ctx.audit_request) {
    classification = "handoff_ready";
    candidates.push(handoffRequest(
      "lead-qualification-agent",
      "helpdesk-agent",
      "Lead asked a service, package, dashboard, pricing, support, or managed operations question outside qualification scope.",
      "Use supplied lead/contact context only and answer from approved service or FAQ knowledge."
    ));
  } else if (!ctx.consent || ctx.consent.can_email !== true) {
    classification = "needs_more_info";
    candidates.push(contextRequest("lead-qualification-agent", "lead", "Need consent and prior interaction context before follow-up.", [
      "identity",
      "workflow_state",
      "lead",
    ]));
  } else {
    if (signals.includes("audit_or_planning_intent")) {
      classification = "audit_candidate";
      confidence = "high";
    } else if (signals.includes("orchestration_or_integration_signal") || signals.includes("managed_operations_interest")) {
      classification = "deployment_candidate";
      confidence = "medium";
    } else if (signals.includes("ai_automation_interest") || signals.includes("workflow_or_operations_pain")) {
      classification = "qualified_candidate";
    }
    candidates.push(communicationRequest(
      "lead-qualification-agent",
      "lead_follow_up_questions",
      contactRef,
      "Thanks for reaching out. Please share the workflow you want evaluated, systems involved, monthly volume, success criteria, timeline, and budget range."
    ));
  }

  return {
    ...baseResult("lead-qualification-agent", body, classification, confidence, candidates),
    handoff: classification === "handoff_ready" ? {
      ready: true,
      target_agent: "helpdesk-agent",
      reason: "Lead asked a service, package, dashboard, pricing, support, or managed operations question outside qualification scope.",
      context_summary: "Use supplied lead/contact context only and answer from approved service or FAQ knowledge.",
    } : {
      ready: false,
      target_agent: null,
      reason: null,
      context_summary: null,
    },
    lead_summary: safeText(ctx.lead?.message || "Lead context received."),
    business_summary: safeText(ctx.account?.company_name || ctx.lead?.service_interest || "Business context not fully supplied."),
    signals,
    recommended_questions: [
      "Which workflow or process should Syntrixa evaluate first?",
      "What systems, tools, or teams are involved?",
      "How often does this workflow run and where does manual work slow it down?",
      "What outcome would make an audit or implementation successful?",
      "What timeline and budget range should planning respect?"
    ],
    qualification_scores: {
      authenticity: classification === "reject_spam" ? 0 : 70,
      business_fit: signals.length > 0 ? 75 : 45,
      automation_potential: signals.includes("ai_automation_interest") || signals.includes("workflow_or_operations_pain") ? 80 : 40,
      orchestration_suitability: signals.includes("orchestration_or_integration_signal") ? 80 : 45,
      readiness: classification === "needs_more_info" ? 35 : 60,
    },
    automation_assessment: {
      likely_fit: signals.includes("ai_automation_interest") || signals.includes("workflow_or_operations_pain"),
      evidence: signals,
    },
    orchestration_assessment: {
      likely_complexity: signals.includes("orchestration_or_integration_signal") ? "medium_to_high" : "unknown",
      needs_system_map: true,
    },
    qualification: {
      status: classification,
      source: "n8n-packaged-context",
    },
  };
}

function researchResult(body) {
  const ctx = context(body);
  const candidates = [];
  let classification = "research_summary_ready";

  if (!Array.isArray(ctx.public_intelligence) || ctx.public_intelligence.length === 0) {
    classification = "needs_more_info";
    candidates.push(contextRequest("research-agent", "research", "Need n8n-collected public intelligence package before research synthesis.", [
      "research",
      "lead",
      "knowledge",
    ]));
  }

  return {
    ...baseResult("research-agent", body, classification, "medium", candidates),
    subject_summary: safeText(ctx.account?.company_name || ctx.lead?.service_interest || "Research subject context received."),
    research_lens: "map business evidence to automation fit, operational pain, orchestration opportunity, and risk.",
    opportunity_signals: [],
    risk_signals: classification === "needs_more_info" ? ["public intelligence package missing"] : [],
  };
}

function helpdeskResult(body) {
  const ctx = context(body);
  const candidates = [];
  let classification = "answer_ready";

  if (!Array.isArray(ctx.knowledge_context) || ctx.knowledge_context.length === 0) {
    classification = "needs_more_info";
    candidates.push(contextRequest("helpdesk-agent", "helpdesk", "Need service/FAQ knowledge context before drafting support answer.", [
      "knowledge",
      "identity",
      "helpdesk",
    ]));
  } else {
    candidates.push(communicationRequest(
      "helpdesk-agent",
      "helpdesk_response",
      ctx.subject_refs?.user_id || ctx.contact?.contact_id || "requester",
      "Prepared support response from supplied Syntrixa service, audit, or managed operations knowledge context.",
      "dashboard"
    ));
  }

  return {
    ...baseResult("helpdesk-agent", body, classification, "medium", candidates),
    answer_draft: classification === "answer_ready" ? "Answer draft prepared from supplied context." : "",
    clarifying_questions: classification === "needs_more_info" ? ["Is this about audit/planning, implementation, monthly management, pricing, maintenance, or support entitlement?"] : [],
  };
}

function marketingResult(body) {
  const ctx = context(body);
  const candidates = [];
  let classification = "recommendation_ready";

  if (!ctx.analytics_context && !ctx.crm_context) {
    classification = "needs_more_info";
    candidates.push(contextRequest("marketing-sales-agent", "marketing", "Need normalized analytics or CRM package before marketing recommendation.", [
      "marketing",
      "workflow_state",
    ]));
  } else {
    candidates.push(workflowRequest("marketing-sales-agent", "marketing", "store_marketing_recommendation", {
      summary: "Marketing recommendation prepared from packaged analytics context.",
    }));
  }

  return {
    ...baseResult("marketing-sales-agent", body, classification, "medium", candidates),
    observed_signals: [],
    inferred_signals: [],
    recommendations: classification === "recommendation_ready" ? ["Review the segment with the strongest operations, automation, or orchestration intent signal."] : [],
    messaging_angles: ["managed AI operations partner", "reduce repetitive manual workflows", "connect fragmented systems", "custom automation and orchestration"],
  };
}

function healthResult(body) {
  const ctx = context(body);
  const candidates = [];
  const critical = ctx.failure_context?.severity === "critical" || body.priority === "urgent";
  let classification = critical ? "escalate" : "incident_report_ready";

  if (!ctx.failure_context && !ctx.monitoring_context) {
    classification = "needs_more_info";
    candidates.push(contextRequest("health-monitoring-agent", "health", "Need diagnostic package before health reasoning.", [
      "health",
      "workflow_state",
      "audit",
    ]));
  } else if (critical) {
    candidates.push(humanIntervention("health-monitoring-agent", "Critical incident package received.", "Human operator must choose escalation/recovery path."));
  } else {
    candidates.push(workflowRequest("health-monitoring-agent", "health", "record_health_incident", {
      severity: ctx.failure_context?.severity || "medium",
      summary: "Health incident summarized from n8n diagnostic package.",
    }, "high"));
  }

  return {
    ...baseResult("health-monitoring-agent", body, classification, critical ? "high" : "medium", candidates),
    severity: ctx.failure_context?.severity || (critical ? "critical" : "medium"),
    operations_impact_lens: "evaluate managed monthly operations impact, retry safety, and client-facing escalation need.",
    sanitized_summary: safeText(ctx.failure_context?.summary || "Health context received."),
    trace_refs: ctx.trace_refs || [],
    likely_owner: ctx.failure_context?.likely_owner || "unknown",
    retry_metadata: ctx.failure_context?.retry_metadata || null,
  };
}

function syntraResult(body) {
  const target = inferAgent(body);
  if (target && target !== "syntra") {
    return {
      ...baseResult("syntra", body, "route", "medium", []),
      summary: `Route to ${target}.`,
      handoff: {
        ready: true,
        target_agent: target,
        reason: "Narrowest safe specialist selected by event context.",
        context_summary: "Use supplied n8n context package only.",
      },
    };
  }
  return baseResult("syntra", body, "request_more_context", "low", [
    contextRequest("syntra", "escalation", "Need target_agent or clearer event_type for routing.", ["workflow_state"]),
  ]);
}

function inferAgent(body) {
  if (agents.has(body.target_agent)) {
    return body.target_agent;
  }
  if (agents.has(body.agent)) {
    return body.agent;
  }
  const eventType = String(body.event_type || "").toLowerCase();
  if (eventType.includes("lead") || eventType.includes("contact") || eventType.includes("audit") || eventType.includes("consultation")) return "lead-qualification-agent";
  if (eventType.includes("research")) return "research-agent";
  if (eventType.includes("helpdesk") || eventType.includes("support") || eventType.includes("faq")) return "helpdesk-agent";
  if (eventType.includes("marketing") || eventType.includes("campaign") || eventType.includes("sales")) return "marketing-sales-agent";
  if (eventType.includes("health") || eventType.includes("failure") || eventType.includes("incident")) return "health-monitoring-agent";
  return "syntra";
}

function validateInvoke(body) {
  const errors = [];
  const target = inferAgent(body);
  if (!agents.has(target)) {
    errors.push("target_agent is not supported");
  }
  const ctx = context(body);
  if (!ctx || typeof ctx !== "object" || Array.isArray(ctx)) {
    errors.push("context_package must be an object");
  }
  if (ctx.constraints) {
    if (ctx.constraints.minimal_context !== true) {
      errors.push("context_package.constraints.minimal_context must be true");
    }
    if (ctx.constraints.no_raw_secrets !== true) {
      errors.push("context_package.constraints.no_raw_secrets must be true");
    }
  }
  return { target, errors };
}

function validateResult(result) {
  const errors = [];
  if (result.type !== "agent_result") errors.push("result.type must be agent_result");
  if (!agents.has(result.agent)) errors.push("result.agent is unsupported");
  if (!result.event_type) errors.push("result.event_type is required");
  if (!result.classification) errors.push("result.classification is required");
  if (!["low", "medium", "high"].includes(result.confidence)) errors.push("result.confidence is invalid");
  if (!Array.isArray(result.n8n_request_candidates)) errors.push("n8n_request_candidates must be an array");

  for (const candidate of result.n8n_request_candidates || []) {
    for (const key of ["id", "type", "category", "priority", "requester", "timestamp", "version"]) {
      if (candidate[key] === undefined) errors.push(`candidate.${key} is required`);
    }
    if (!requestTypes.has(candidate.type)) errors.push(`candidate.type is invalid: ${candidate.type}`);
    if (!categories.has(candidate.category)) errors.push(`candidate.category is invalid: ${candidate.category}`);
    if (candidate.version !== contractVersion) errors.push("candidate.version must be 1.0");
    if (!candidate.requester || !agents.has(candidate.requester.id)) errors.push("candidate.requester.id is invalid");
  }

  return errors;
}

function invoke(body) {
  const { target, errors } = validateInvoke(body);
  if (errors.length > 0) {
    return { status: 422, body: { ok: false, errors } };
  }

  const handlers = {
    syntra: syntraResult,
    "lead-qualification-agent": leadResult,
    "research-agent": researchResult,
    "helpdesk-agent": helpdeskResult,
    "marketing-sales-agent": marketingResult,
    "health-monitoring-agent": healthResult,
  };
  const result = handlers[target](body);
  const resultErrors = validateResult(result);
  if (resultErrors.length > 0) {
    return { status: 500, body: { ok: false, errors: resultErrors, result } };
  }
  return { status: 200, body: { ok: true, result } };
}

function proxyResponse(kind, body) {
  const requestId = body.request_id || body.id || randomUUID();
  const base = {
    ok: true,
    kind,
    request_id: requestId,
    collected_at: now(),
    constraints: {
      no_raw_secrets: true,
      minimal_context: true,
      ...(body.constraints || {}),
    },
    source: "syntrixa-local-dev-proxy",
  };

  if (kind === "public_intelligence") {
    return {
      ...base,
      public_intelligence: [
        {
          source_type: "local_stub",
          title: "Public intelligence connector placeholder",
          summary: "Replace PUBLIC_INTEL_PROXY_URL with the approved scraper/search service before production.",
          confidence: "low",
        },
      ],
    };
  }

  if (kind === "marketing_analytics") {
    return {
      ...base,
      analytics_context: {
        campaign_id: body.campaign_id || body.payload?.campaign_id || `campaign-${requestId}`,
        metrics: [
          { channel: "linkedin", impressions: 1840, clicks: 96, leads: 7, conversion_rate: 0.073 },
          { channel: "email", impressions: 620, clicks: 88, leads: 11, conversion_rate: 0.125 },
          { channel: "website", impressions: 1320, clicks: 141, leads: 9, conversion_rate: 0.064 },
        ],
        audience_segments: [
          "small agencies with manual client reporting",
          "ecommerce teams with inventory/support friction",
          "service businesses needing managed AI operations",
        ],
        summary: "Local marketing analytics package assembled for campaign planning. Replace MARKETING_ANALYTICS_PROXY_URL with approved live analytics when production credentials exist.",
      },
      crm_context: {
        lifecycle_stage: "discovery",
        intent_signals: ["workflow audit request", "manual operations pain", "interest in managed monthly AI operations"],
        objections: ["implementation complexity", "scope clarity", "monthly support boundaries"],
      },
      social_accounts: {
        linkedin: { connected: Boolean(process.env.LINKEDIN_ACCESS_TOKEN), action: "stage_post" },
        x: { connected: Boolean(process.env.X_ACCESS_TOKEN), action: "stage_post" },
        instagram: { connected: Boolean(process.env.META_ACCESS_TOKEN), action: "stage_asset_review" },
        email: { connected: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY), action: "stage_sequence" },
      },
    };
  }

  return {
    ...base,
    monitoring_context: {
      status: "ok",
      check: body.check || kind,
      summary: `${kind} local development check completed.`,
    },
  };
}

if (process.argv[2] === "--fixture") {
  const fixturePath = process.argv[3];
  if (!fixturePath) {
    console.error("Usage: node agent-invoke-server.mjs --fixture <input.json>");
    process.exit(2);
  }
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  const response = invoke(fixture);
  console.log(JSON.stringify(response.body, null, 2));
  process.exit(response.status >= 400 ? 1 : 0);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/health" || req.url === "/openclaw/health")) {
    return sendJson(res, 200, {
      ok: true,
      service: "syntrixa-openclaw-agent-invoke",
      version: contractVersion,
      agents: Array.from(agents),
    });
  }

  const internalProxyKinds = {
    "/internal/public-intelligence": "public_intelligence",
    "/internal/marketing-analytics": "marketing_analytics",
    "/internal/infra-health": "infra_health",
    "/internal/docker-health": "docker_health",
    "/internal/vps-monitoring": "vps_monitoring",
  };

  if (req.method === "POST" && internalProxyKinds[req.url]) {
    try {
      const body = await collectJson(req);
      return sendNoStoreJson(res, 200, proxyResponse(internalProxyKinds[req.url], body));
    } catch (error) {
      return sendNoStoreJson(res, 400, { ok: false, errors: [error.message] });
    }
  }

  if (req.method === "POST" && req.url === "/openclaw/agent/invoke") {
    if (!authorize(req)) {
      return sendJson(res, 401, { ok: false, errors: ["unauthorized"] });
    }
    try {
      const body = await collectJson(req);
      const response = invoke(body);
      return sendJson(res, response.status, response.body);
    } catch (error) {
      return sendJson(res, 400, { ok: false, errors: [error.message] });
    }
  }

  return sendJson(res, 404, { ok: false, errors: ["not found"] });
});

server.listen(port, host, () => {
  console.log(`Syntrixa OpenClaw invoke server listening on ${host}:${port}`);
});
