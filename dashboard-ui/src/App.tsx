import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Clock,
  Command,
  Database,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityEvent,
  Agent,
  Approval,
  createWorkflow,
  DashboardData,
  decideApproval,
  getDashboard,
  invokeAgent,
  KanbanCard,
  moveKanbanTask,
  sendSupervisorMessage,
} from "./lib/api";

const navItems = [
  ["Overview", LayoutDashboard],
  ["Agents", Bot],
  ["Workflows", Workflow],
  ["Kanban", GitBranch],
  ["Approvals", ShieldCheck],
  ["Analytics", Activity],
  ["Messages", MessageSquare],
  ["Settings", Settings],
] as const;

const modeOptions = [
  { id: "autopilot", label: "Autopilot" },
  { id: "human-loop", label: "Human Loop" },
  { id: "review-only", label: "Review Only" },
] as const;

const iconMap = {
  workflow: Workflow,
  bot: Bot,
  "shield-check": ShieldCheck,
  database: Database,
  clock: Clock,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function agentLabel(id: string, agents: Agent[]) {
  return agents.find((agent) => agent.id === id)?.shortName || id.replace("-agent", "");
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [dark, setDark] = useState(true);
  const [mode, setMode] = useState<(typeof modeOptions)[number]["id"]>("human-loop");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    refreshDashboard().catch((err) => setError(err.message));
  }, []);

  async function refreshDashboard() {
    const next = await getDashboard();
    setData(next);
    return next;
  }

  async function runAction(label: string, action: () => Promise<unknown>) {
    setBusyAction(label);
    setNotice("");
    try {
      await action();
      await refreshDashboard();
      setNotice(label);
      window.setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyAction("");
    }
  }

  function handleCreateWorkflow() {
    return runAction("Workflow created and queued", () =>
      createWorkflow({
        title: "Operator-created Syntrixa workflow review",
        description: "Dashboard operator requested a new workflow card for Syntra routing and n8n packaging.",
        priority: mode === "autopilot" ? "high" : "medium",
      }),
    );
  }

  if (error) {
    return (
      <main className="syntrixa-shell flex min-h-screen items-center justify-center p-6">
        <div className="glass max-w-lg rounded-3xl p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-mint-500">Syntrixa OS</p>
          <h1 className="mt-3 text-2xl font-semibold">Dashboard API unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-cyan-100/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="syntrixa-shell flex min-h-screen items-center justify-center">
        <div className="glass rounded-full px-5 py-3 text-sm text-slate-700 dark:text-cyan-100">
          Connecting Syntrixa Core...
        </div>
      </main>
    );
  }

  return (
    <div className="syntrixa-shell relative text-slate-950 dark:text-cyan-50">
      <div className="grid-overlay" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1 lg:pl-[260px]">
          <Topbar
            busy={busyAction === "Workflow created and queued"}
            dark={dark}
            mode={mode}
            online={data.runtime.online}
            onCreateWorkflow={handleCreateWorkflow}
            onMenu={() => setSidebarOpen(true)}
            onMode={setMode}
            onTheme={() => setDark((value) => !value)}
          />
          <main className="space-y-5 p-4 pb-8 sm:p-5 xl:p-7">
            {notice && (
              <div className="glass fixed right-4 top-20 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm shadow-glow">
                {notice}
              </div>
            )}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {data.kpis.map((kpi, index) => (
                <KpiCard key={kpi.id} kpi={kpi} index={index} />
              ))}
            </section>

            <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
              <SyntrixaCore data={data} />
              <SupervisorChat mode={mode} online={data.runtime.online} onRefresh={refreshDashboard} />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <AgentStatus
                agents={data.agents}
                onInvoke={(agent) =>
                  runAction(`${agent.shortName} invoked`, () =>
                    invokeAgent({ targetAgent: agent.id, message: `Dashboard operator requested a live status review from ${agent.name}.` }),
                  )
                }
              />
              <LiveActivity initialEvents={data.activity} />
            </section>

            <KanbanBoard
              data={data}
              onMove={(taskId, column) => runAction("Kanban task moved", () => moveKanbanTask(taskId, column))}
            />

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <ApprovalQueue
                approvals={data.approvals}
                agents={data.agents}
                busyAction={busyAction}
                onDecision={(id, decision) => runAction(`Approval ${decision}d`, () => decideApproval(id, decision))}
              />
              <Analytics data={data} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button
        className={cx("fixed inset-0 z-30 bg-slate-950/40 lg:hidden", open ? "block" : "hidden")}
        aria-label="Close sidebar"
        onClick={onClose}
      />
      <aside
        className={cx(
          "glass fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col rounded-r-[24px] p-4 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-mint-300 to-cyanx-400 text-slate-950 shadow-glow">
            <Command size={21} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">Syntrixa OS</p>
            <p className="truncate text-xs text-slate-500 dark:text-cyan-100/55">OpenClaw command layer</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map(([label, Icon]) => {
            const active = label === "Overview";
            return (
              <button
                key={label}
                className={cx(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                  active
                    ? "border border-mint-300/45 bg-mint-300/16 text-mint-700 shadow-glow dark:text-mint-100"
                    : "text-slate-600 hover:bg-white/45 hover:text-slate-950 dark:text-cyan-100/62 dark:hover:bg-white/6 dark:hover:text-cyan-50",
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-mint-300/20 bg-white/34 p-3 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-mint-200 dark:bg-mint-300 dark:text-slate-950">
              <UserRound size={17} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Syntrixa Team</p>
              <p className="truncate text-xs text-slate-500 dark:text-cyan-100/55">Human operators</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  busy,
  dark,
  mode,
  online,
  onCreateWorkflow,
  onMenu,
  onMode,
  onTheme,
}: {
  busy: boolean;
  dark: boolean;
  mode: string;
  online: boolean;
  onCreateWorkflow: () => void;
  onMenu: () => void;
  onMode: (mode: "autopilot" | "human-loop" | "review-only") => void;
  onTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-mint-300/15 bg-cyan-50/60 px-4 py-3 backdrop-blur-2xl dark:bg-slate-950/32 sm:px-5 xl:px-7">
      <div className="flex flex-wrap items-center gap-3">
        <button className="glass grid h-10 w-10 place-items-center rounded-2xl lg:hidden" onClick={onMenu}>
          <Menu size={18} />
        </button>
        <label className="glass flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-2xl px-3 md:max-w-md">
          <Search size={17} className="text-slate-500 dark:text-cyan-100/55" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-cyan-100/45"
            placeholder="Search workflows, agents, approvals..."
          />
        </label>
        <div className="glass flex rounded-2xl p-1">
          {modeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onMode(option.id)}
              className={cx(
                "relative rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm",
                mode === option.id ? "text-slate-950 dark:text-slate-950" : "text-slate-500 dark:text-cyan-100/65",
              )}
            >
              {mode === option.id && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-mint-300 to-cyanx-300"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          ))}
        </div>
        <div className="glass flex h-11 items-center gap-2 rounded-full px-3 text-sm">
          <span className={cx("h-2.5 w-2.5 rounded-full", online ? "bg-mint-400 shadow-glow" : "bg-amber-400")} />
          <span className="hidden sm:inline">{online ? "System online" : "Offline fallback"}</span>
        </div>
        <IconButton label="Notifications">
          <Bell size={17} />
        </IconButton>
        <IconButton label="Toggle theme" onClick={onTheme}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-mint-300 to-cyanx-300 px-4 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70"
          disabled={busy}
          onClick={onCreateWorkflow}
        >
          <Plus size={17} />
          <span className="hidden sm:inline">{busy ? "Creating..." : "Create Workflow"}</span>
        </button>
      </div>
    </header>
  );
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="glass grid h-11 w-11 place-items-center rounded-full transition hover:scale-[1.03] hover:border-mint-300/55"
    >
      {children}
    </button>
  );
}

function KpiCard({ kpi, index }: { kpi: DashboardData["kpis"][number]; index: number }) {
  const Icon = iconMap[kpi.icon as keyof typeof iconMap] || Activity;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      className="glass rounded-3xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-mint-300/18 text-mint-700 dark:text-mint-200">
          <Icon size={19} />
        </div>
        <span className="rounded-full border border-mint-300/25 bg-mint-300/12 px-2 py-1 text-[11px] text-mint-700 dark:text-mint-100">
          {kpi.trend}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-normal">{kpi.value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-cyan-100/58">{kpi.label}</p>
    </motion.div>
  );
}

function SyntrixaCore({ data }: { data: DashboardData }) {
  const positions = [
    "left-[8%] top-[18%]",
    "right-[10%] top-[18%]",
    "left-[3%] top-[58%]",
    "right-[5%] top-[58%]",
    "left-[35%] bottom-[5%]",
  ];

  return (
    <section className="glass overflow-hidden rounded-[24px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Parent AI command layer</p>
          <h2 className="mt-2 text-xl font-semibold">Syntrixa Core</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-cyan-100/62">{data.core.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.core.rules.map((rule) => (
            <span key={rule} className="rounded-full border border-mint-300/24 bg-mint-300/10 px-3 py-1 text-xs text-slate-600 dark:text-cyan-100/70">
              {rule}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-5 min-h-[320px] rounded-[22px] border border-mint-300/18 bg-white/22 p-4 dark:bg-slate-950/18">
        <div className="absolute inset-8 rounded-full border border-dashed border-mint-300/25" />
        <div className="absolute inset-x-[18%] top-1/2 h-px bg-gradient-to-r from-transparent via-mint-300/60 to-transparent" />
        <div className="absolute inset-y-[18%] left-1/2 w-px bg-gradient-to-b from-transparent via-cyanx-300/55 to-transparent" />
        <motion.div
          animate={{ boxShadow: ["0 0 22px rgba(52,244,190,.18)", "0 0 42px rgba(52,244,190,.32)", "0 0 22px rgba(52,244,190,.18)"] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-mint-300/45 bg-gradient-to-br from-mint-300/28 to-cyanx-300/18 text-center backdrop-blur-xl"
        >
          <div>
            <Sparkles className="mx-auto text-mint-300" size={24} />
            <p className="mt-2 text-sm font-semibold">Syntra</p>
            <p className="text-xs text-slate-500 dark:text-cyan-100/60">Supervisor</p>
          </div>
        </motion.div>
        {data.core.connectedAgents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={cx("absolute w-[150px] rounded-2xl border border-mint-300/25 bg-white/58 p-3 shadow-glass backdrop-blur-xl dark:bg-slate-950/52", positions[index])}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-mint-400 shadow-glow" />
              <p className="truncate text-sm font-medium">{agent.shortName}</p>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-cyan-100/55">{agent.classification}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SupervisorChat({ mode, online, onRefresh }: { mode: string; online: boolean; onRefresh: () => Promise<DashboardData> }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "initial",
      role: "syntra",
      summary: "I can route dashboard commands to the safest specialist path while n8n keeps execution, credentials, and storage outside OpenClaw.",
      actions: [{ label: "Route safely", type: "route" }],
    },
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "human", summary: message, actions: [] }]);
    setInput("");
    setBusy(true);
    try {
      const response = await sendSupervisorMessage(message, mode);
      const executionLabel = response.message.n8n?.attempted
        ? response.message.n8n.ok
          ? `n8n executed (${response.message.n8n.status})`
          : `n8n needs review (${response.message.n8n.status || "offline"})`
        : "OpenClaw reviewed";
      setMessages((items) => [
        ...items,
        {
          id: response.message.id,
          role: "syntra",
          summary: response.message.summary,
          actions: [{ label: executionLabel, type: "n8n_execution" }, ...(response.message.actions || [])],
        },
      ]);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass flex min-h-[420px] flex-col rounded-[24px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Supervisor chat</p>
          <h2 className="mt-2 text-xl font-semibold">Human to Syntra</h2>
        </div>
        <span className={cx("rounded-full px-3 py-1 text-xs", online ? "bg-mint-300/16 text-mint-700 dark:text-mint-100" : "bg-amber-300/18 text-amber-700 dark:text-amber-100")}>
          {online ? "OpenClaw linked" : "Fallback mode"}
        </span>
      </div>
      <div className="thin-scrollbar mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cx(
              "rounded-2xl border p-3 text-sm",
              message.role === "human"
                ? "ml-8 border-cyanx-300/20 bg-cyanx-300/12"
                : "mr-8 border-mint-300/25 bg-mint-300/12",
            )}
          >
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-cyan-100/55">{message.role === "human" ? "Human operator" : "Syntra Supervisor"}</p>
            <p className="leading-relaxed text-slate-700 dark:text-cyan-50/84">{message.summary}</p>
            {message.actions?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.actions.map((action) => (
                  <span key={`${message.id}-${action.label}`} className="rounded-full border border-mint-300/25 bg-white/30 px-2 py-1 text-[11px] text-slate-600 dark:bg-white/[0.04] dark:text-cyan-100/70">
                    {action.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-w-0 flex-1 rounded-2xl border border-mint-300/22 bg-white/45 px-4 py-3 text-sm outline-none transition focus:border-mint-300/65 dark:bg-slate-950/30"
          placeholder="Ask Syntra to route, review, or package a workflow..."
        />
        <button className="rounded-2xl bg-gradient-to-r from-mint-300 to-cyanx-300 px-4 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.02]" disabled={busy}>
          {busy ? "Routing" : "Send"}
        </button>
      </form>
    </section>
  );
}

function AgentStatus({ agents, onInvoke }: { agents: Agent[]; onInvoke: (agent: Agent) => void }) {
  return (
    <section className="glass rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Agent network</p>
          <h2 className="mt-2 text-xl font-semibold">OpenClaw specialists</h2>
        </div>
        <Bot className="text-mint-400" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            whileHover={{ y: -2 }}
            className="rounded-3xl border border-mint-300/20 bg-white/42 p-4 transition dark:bg-slate-950/28"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{agent.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-cyan-100/55">{agent.role}</p>
              </div>
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-mint-400 shadow-glow" />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="rounded-full bg-mint-300/14 px-2 py-1 text-mint-700 dark:text-mint-100">{agent.status}</span>
              <span className="text-slate-500 dark:text-cyan-100/55">{agent.tasks} tasks</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-900/8 dark:bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-mint-300 to-cyanx-300" style={{ width: `${agent.health}%` }} />
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-cyan-100/62">{agent.lastAction}</p>
            <button
              className="mt-4 w-full rounded-2xl border border-mint-300/22 bg-mint-300/10 px-3 py-2 text-xs font-medium text-mint-700 transition hover:border-mint-300/55 hover:bg-mint-300/16 dark:text-mint-100"
              onClick={() => onInvoke(agent)}
            >
              Invoke status review
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LiveActivity({ initialEvents }: { initialEvents: ActivityEvent[] }) {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.addEventListener("activity", (event) => {
      const item = JSON.parse(event.data) as ActivityEvent;
      setEvents((current) => [item, ...current].slice(0, 7));
    });
    source.onerror = () => source.close();
    return () => source.close();
  }, []);

  return (
    <section className="glass rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Live stream</p>
          <h2 className="mt-2 text-xl font-semibold">Runtime activity</h2>
        </div>
        <Activity className="text-mint-400" />
      </div>
      <div className="mt-5 space-y-3">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={cx(
              "rounded-2xl border p-3",
              index === 0 ? "border-mint-300/45 bg-mint-300/14 shadow-glow" : "border-mint-300/16 bg-white/30 dark:bg-white/[0.03]",
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cx("mt-1 h-2.5 w-2.5 rounded-full", event.tone === "amber" ? "bg-amber-400" : event.tone === "cyan" ? "bg-cyanx-300" : "bg-mint-400")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.agent}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-cyan-100/62">{event.message}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500 dark:text-cyan-100/45">{event.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KanbanBoard({ data, onMove }: { data: DashboardData; onMove: (taskId: string, column: string) => void }) {
  return (
    <section className="glass rounded-[24px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Workflow control</p>
          <h2 className="mt-2 text-xl font-semibold">Kanban operations board</h2>
        </div>
        <span className="rounded-full border border-mint-300/22 bg-white/30 px-3 py-1 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-cyan-100/62">
          Drag-ready visual lanes
        </span>
      </div>
      <div className="thin-scrollbar mt-5 flex gap-4 overflow-x-auto pb-2">
        {data.kanbanColumns.map((column) => (
          <div key={column.id} className="w-[300px] shrink-0 rounded-3xl border border-mint-300/18 bg-white/32 p-3 dark:bg-slate-950/22">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <span className="rounded-full bg-mint-300/14 px-2 py-1 text-xs text-mint-700 dark:text-mint-100">{column.cards.length}</span>
            </div>
            <div className="space-y-3">
              {column.cards.map((card) => (
                <KanbanTask key={card.id} card={card} agents={data.agents} onMove={onMove} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KanbanTask({ card, agents, onMove }: { card: KanbanCard; agents: Agent[]; onMove: (taskId: string, column: string) => void }) {
  const priorityClass = {
    high: "border-amber-300/32 bg-amber-300/12 text-amber-700 dark:text-amber-100",
    medium: "border-cyanx-300/32 bg-cyanx-300/12 text-cyan-700 dark:text-cyan-100",
    low: "border-mint-300/32 bg-mint-300/12 text-mint-700 dark:text-mint-100",
  }[card.priority];

  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-mint-300/18 bg-white/62 p-3 shadow-glass dark:bg-slate-950/48"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-medium leading-snug">{card.title}</h4>
        {card.approval ? <ShieldAlert className="shrink-0 text-amber-400" size={16} /> : <Check className="shrink-0 text-mint-400" size={16} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={cx("rounded-full border px-2 py-1 text-[11px] capitalize", priorityClass)}>{card.priority}</span>
        {card.approval && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-100">Human approval</span>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-cyan-100/55">
        <span className="truncate">{agentLabel(card.agent, agents)}</span>
        <span className="shrink-0">{card.sla}</span>
      </div>
      <p className="mt-2 truncate text-xs text-slate-600 dark:text-cyan-100/62">{card.status}</p>
      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 rounded-xl border border-mint-300/18 bg-white/28 px-2 py-1.5 text-[11px] transition hover:border-mint-300/55 dark:bg-white/[0.04]"
          onClick={() => onMove(card.id, card.approval ? "waiting-approval" : "in-progress")}
        >
          Review
        </button>
        <button
          className="flex-1 rounded-xl bg-mint-300/16 px-2 py-1.5 text-[11px] text-mint-700 transition hover:bg-mint-300/24 dark:text-mint-100"
          onClick={() => onMove(card.id, card.approval ? "waiting-approval" : "automated")}
        >
          Advance
        </button>
      </div>
    </motion.article>
  );
}

function ApprovalQueue({
  approvals,
  agents,
  busyAction,
  onDecision,
}: {
  approvals: Approval[];
  agents: Agent[];
  busyAction: string;
  onDecision: (id: string, decision: "approve" | "edit" | "reject") => void;
}) {
  const visibleApprovals = approvals.filter((approval) => approval.state === "pending");
  return (
    <section className="glass rounded-[24px] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Human loop</p>
        <h2 className="mt-2 text-xl font-semibold">Approval queue</h2>
      </div>
      <div className="mt-5 space-y-4">
        {visibleApprovals.length === 0 && (
          <div className="rounded-3xl border border-mint-300/18 bg-mint-300/10 p-4 text-sm text-slate-600 dark:text-cyan-100/70">
            No approvals are waiting. Human loop is clear.
          </div>
        )}
        {visibleApprovals.map((approval) => (
          <article key={approval.id} className="rounded-3xl border border-mint-300/18 bg-white/38 p-4 dark:bg-slate-950/26">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{approval.title}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-cyan-100/55">{agentLabel(approval.requester, agents)} recommendation</p>
              </div>
              <span className={cx("rounded-full px-2 py-1 text-xs", approval.riskLevel === "High" ? "bg-amber-300/18 text-amber-700 dark:text-amber-100" : "bg-cyanx-300/14 text-cyan-700 dark:text-cyan-100")}>
                {approval.riskLevel} risk
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-cyan-100/65">{approval.context}</p>
            <div className="mt-3 rounded-2xl border border-mint-300/16 bg-mint-300/8 p-3 text-sm text-slate-700 dark:text-cyan-50/80">
              {approval.recommendation}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={Boolean(busyAction)} onClick={() => onDecision(approval.id, "approve")} className="rounded-full bg-mint-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">Approve</button>
              <button disabled={Boolean(busyAction)} onClick={() => onDecision(approval.id, "edit")} className="rounded-full border border-mint-300/25 bg-white/30 px-4 py-2 text-sm transition hover:border-mint-300/55 disabled:opacity-60 dark:bg-white/[0.04]">Edit</button>
              <button disabled={Boolean(busyAction)} onClick={() => onDecision(approval.id, "reject")} className="rounded-full border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm text-red-700 transition hover:bg-red-300/16 disabled:opacity-60 dark:text-red-100">Reject</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Analytics({ data }: { data: DashboardData }) {
  const tooltipStyle = useMemo(
    () => ({
      borderRadius: 14,
      border: "1px solid rgba(94, 234, 212, .25)",
      background: "rgba(8, 28, 39, .9)",
      color: "#ecfeff",
    }),
    [],
  );

  return (
    <section className="glass rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600 dark:text-mint-200">Analytics</p>
          <h2 className="mt-2 text-xl font-semibold">Operations signal</h2>
        </div>
        <HeartPulse className="text-mint-400" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartPanel title="Automation volume">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.analytics.automationVolume}>
              <defs>
                <linearGradient id="mintArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.58} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(94,234,212,.12)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#5eead4" strokeWidth={2} fill="url(#mintArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Agent workload">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.analytics.agentWorkload}>
              <CartesianGrid stroke="rgba(94,234,212,.12)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#67e8f9" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Saved hours">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data.analytics.savedHours}>
              <CartesianGrid stroke="rgba(94,234,212,.12)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="#34d39922" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Risk prevented">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data.analytics.riskPrevented}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </section>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-mint-300/18 bg-white/34 p-4 dark:bg-slate-950/24">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ChevronRight size={16} className="text-mint-400" />
      </div>
      {children}
    </div>
  );
}

export default App;
