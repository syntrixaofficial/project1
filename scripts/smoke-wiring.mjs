const endpoints = {
  dashboardUi: process.env.SMOKE_DASHBOARD_UI_URL || "http://127.0.0.1:5173/",
  dashboardApi: process.env.SMOKE_DASHBOARD_API_URL || "http://127.0.0.1:18080",
  openclaw: process.env.SMOKE_OPENCLAW_URL || "http://127.0.0.1:8990",
  n8nIntent: process.env.SMOKE_N8N_INTENT_URL || "http://127.0.0.1:5678/webhook/openclaw/intent/",
};

const categories = [
  ["communication", "communication_request", "syntra"],
  ["contact", "workflow_request", "lead-qualification-agent"],
  ["lead", "workflow_request", "lead-qualification-agent"],
  ["research", "context_request", "research-agent"],
  ["helpdesk", "workflow_request", "helpdesk-agent"],
  ["marketing", "workflow_request", "marketing-sales-agent"],
  ["health", "workflow_request", "health-monitoring-agent"],
  ["memory", "memory_update", "syntra"],
  ["escalation", "human_intervention", "health-monitoring-agent"],
  ["infrastructure", "workflow_request", "health-monitoring-agent"],
];

async function request(name, url, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text.slice(0, 240);
    }
    return {
      name,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      body,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error.message,
    };
  }
}

function payloadFor(category, type, targetAgent) {
  return {
    id: `smoke-${category}-${Date.now()}`,
    type,
    category,
    version: "1.0",
    priority: category === "escalation" ? "urgent" : "normal",
    requester: "smoke-wiring",
    target_agent: targetAgent,
    workflow: `smoke_${category}_wiring`,
    purpose: `Verify ${category} wiring across dashboard, n8n, OpenClaw, and storage.`,
    context_package: {
      package_id: `smoke-${category}`,
      source_workflow: "scripts/smoke-wiring.mjs",
      subject_refs: { category },
      constraints: { minimal_context: true, no_raw_secrets: true },
    },
    payload: {
      title: `Smoke ${category}`,
      message: `Wiring smoke for ${category}`,
      category,
    },
  };
}

const checks = [];
checks.push(await request("dashboard-ui", endpoints.dashboardUi));
checks.push(await request("dashboard-api-health", `${endpoints.dashboardApi}/health`));
checks.push(await request("dashboard-api-dashboard", `${endpoints.dashboardApi}/api/dashboard`));
checks.push(await request("openclaw-health", `${endpoints.openclaw}/openclaw/health`));

for (const [category, type, targetAgent] of categories) {
  checks.push(
    await request(`n8n-${category}`, endpoints.n8nIntent, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadFor(category, type, targetAgent)),
    }),
  );
}

const summary = checks.map((check) => ({
  name: check.name,
  ok: check.ok,
  status: check.status,
  ms: check.ms,
  hint: check.ok ? undefined : check.body?.message || check.error || String(check.body).slice(0, 120),
}));

console.log(JSON.stringify(summary, null, 2));

const failed = summary.filter((check) => !check.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
