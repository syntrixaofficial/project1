export type Agent = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  status: string;
  classification: string;
  tasks: number;
  health: number;
  lastAction: string;
};

export type Kpi = {
  id: string;
  label: string;
  value: string | number;
  trend: string;
  icon: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  agent: string;
  priority: "high" | "medium" | "low";
  sla: string;
  type: string;
  approval: boolean;
  status: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type Approval = {
  id: string;
  title: string;
  requester: string;
  context: string;
  riskLevel: "Low" | "Medium" | "High";
  suggestedAction: string;
  recommendation: string;
  decisionNeeded: string;
  state: "pending" | "approved" | "edited" | "rejected";
  taskId?: string | null;
};

export type ActivityEvent = {
  id: string;
  agent: string;
  message: string;
  time: string;
  tone: "mint" | "cyan" | "amber";
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  ok: boolean;
  generatedAt: string;
  runtime: {
    online: boolean;
    service: string;
    version: string;
    checkedAt: string;
    openclawBaseUrl: string;
  };
  kpis: Kpi[];
  core: {
    title: string;
    subtitle: string;
    supervisor: Agent;
    connectedAgents: Agent[];
    rules: string[];
  };
  agents: Agent[];
  kanbanColumns: KanbanColumn[];
  approvals: Approval[];
  requestCandidates: Array<{
    id: string;
    type: string;
    category: string;
    priority: string;
    target_agent?: string;
    purpose?: string;
    status?: string;
  }>;
  agentRuns: Array<{
    id: string;
    source: string;
    targetAgent: string;
    ok: boolean;
    createdAt: string;
  }>;
  chatMessages: Array<{
    id: string;
    role: string;
    mode?: string;
    summary: string;
    actions?: Array<{ label: string; type: string }>;
    createdAt: string;
  }>;
  analytics: {
    automationVolume: ChartPoint[];
    agentWorkload: ChartPoint[];
    savedHours: ChartPoint[];
    riskPrevented: ChartPoint[];
  };
  activity: ActivityEvent[];
};

export type ChatResponse = {
  ok: boolean;
  message: {
    id: string;
    role: string;
    mode: string;
    createdAt: string;
    summary: string;
    safeActions: string[];
    actions?: Array<{ label: string; type: string }>;
    classification?: string;
    targetAgent?: string;
    n8n?: { ok: boolean; status: number; attempted: boolean };
  };
  openclaw?: unknown;
  n8n?: { attempted: boolean; ok: boolean; status: number; body?: unknown };
  warning?: string;
};

const apiBase = import.meta.env.VITE_DASHBOARD_API_URL || "";

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch(`${apiBase}/api/dashboard`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Dashboard API returned ${response.status}`);
  }
  return response.json();
}

export async function sendSupervisorMessage(message: string, mode: string): Promise<ChatResponse> {
  const response = await fetch(`${apiBase}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, mode }),
  });
  if (!response.ok) {
    throw new Error(`Syntra chat returned ${response.status}`);
  }
  return response.json();
}

export async function createWorkflow(input: { title: string; description?: string; priority?: string; targetAgent?: string }) {
  const response = await fetch(`${apiBase}/api/workflows`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Create workflow returned ${response.status}`);
  return response.json();
}

export async function decideApproval(id: string, decision: "approve" | "edit" | "reject", note = "") {
  const response = await fetch(`${apiBase}/api/approvals/${id}/${decision}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!response.ok) throw new Error(`Approval ${decision} returned ${response.status}`);
  return response.json();
}

export async function moveKanbanTask(id: string, column: string) {
  const response = await fetch(`${apiBase}/api/kanban/${id}/move`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ column }),
  });
  if (!response.ok) throw new Error(`Move task returned ${response.status}`);
  return response.json();
}

export async function invokeAgent(input: { targetAgent: string; message?: string; priority?: string }) {
  const response = await fetch(`${apiBase}/api/agents/invoke`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Agent invoke returned ${response.status}`);
  return response.json();
}
