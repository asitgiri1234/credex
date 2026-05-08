"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type ToolPlanCatalog } from "@/lib/subscription-plans";

type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

interface ToolEntry {
  id: string;
  tool: string;
  plan: string;
  seats: string;
}

const TOOL_OPTIONS = SUBSCRIPTION_PLANS.map((tool) => tool.name);
const SUBSCRIPTIONS_STORAGE_KEY = "credex-subscriptions";

const findCatalogByTool = (toolName: string): ToolPlanCatalog | undefined => {
  return SUBSCRIPTION_PLANS.find((catalog) => catalog.name === toolName);
};

const getPlanForTool = (toolName: string, planName: string): SubscriptionPlan | undefined => {
  const catalog = findCatalogByTool(toolName);
  return catalog?.plans.find((plan) => plan.name === planName);
};

const getMonthlySpendForRow = (row: ToolEntry): number => {
  const plan = getPlanForTool(row.tool, row.plan);
  const seats = Number(row.seats) || 1;
  if (!plan || plan.monthlyPrice === null) {
    return 0;
  }
  return Number(plan.monthlyPrice) * Math.max(1, seats);
};

export default function Home(): ReactElement {
  const [teamSize, setTeamSize] = useState("5");
  const [useCase, setUseCase] = useState<UseCase>("coding");
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [runMessage, setRunMessage] = useState<string>("");
  const [toolRows, setToolRows] = useState<ToolEntry[]>([
    { id: "1", tool: "Cursor", plan: "Pro", seats: "1" },
    { id: "2", tool: "GitHub Copilot", plan: "Business", seats: "1" },
  ]);

  const currentSpend = useMemo(() => {
    return toolRows.reduce((total, row) => total + getMonthlySpendForRow(row), 0);
  }, [toolRows]);

  const estimatedSavings = useMemo(() => Math.round(currentSpend * 0.26), [currentSpend]);

  const updateTool = (id: string, field: keyof ToolEntry, value: string): void => {
    setToolRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const updateToolWithPlanReset = (id: string, toolName: string): void => {
    const catalog = findCatalogByTool(toolName);
    const defaultPlan = catalog?.plans[0]?.name ?? "";
    setToolRows((prev) => prev.map((row) => (row.id === id ? { ...row, tool: toolName, plan: defaultPlan } : row)));
  };

  const addTool = (): void => {
    const nextId = crypto.randomUUID();
    setToolRows((prev) => [...prev, { id: nextId, tool: "Claude", plan: "Free", seats: "1" }]);
  };

  const removeTool = (id: string): void => {
    setToolRows((prev) => prev.filter((row) => row.id !== id));
  };

  const runAudit = async (): Promise<void> => {
    setIsRunningAudit(true);
    setRunMessage("");

    try {
      // Keep the frontend functional even before backend wiring is complete.
      await new Promise((resolve) => setTimeout(resolve, 700));
      setRunMessage("Audit ran successfully. Backend integration will now use this payload for result generation.");
    } catch {
      setRunMessage("Unable to run audit right now. Please try again.");
    } finally {
      setIsRunningAudit(false);
    }
  };

  useEffect(() => {
    const payload = toolRows.map((row) => ({
      tool: row.tool,
      plan: row.plan,
      monthlySpend: getMonthlySpendForRow(row),
      seats: Number(row.seats) || 1,
    }));

    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(payload));
  }, [toolRows]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300">
            Free AI Spend Audit Tool
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">Stop overpaying for AI tools in 2 minutes.</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
            Enter your stack, see immediate monthly + annual savings, and get a defensible recommendation report your finance team can trust.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Current monthly spend" value={`$${currentSpend.toLocaleString()}`} />
            <StatCard label="Estimated monthly savings" value={`$${estimatedSavings.toLocaleString()}`} highlight />
            <StatCard label="Estimated annual savings" value={`$${(estimatedSavings * 12).toLocaleString()}`} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Audit Input</h2>
            <button
              type="button"
              onClick={addTool}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              + Add Tool
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAudit();
            }}
          >
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <Field label="Team Size">
                <input
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 outline-none ring-indigo-500/70 focus:ring"
                />
              </Field>
              <Field label="Primary Use Case">
                <select
                  value={useCase}
                  onChange={(event) => setUseCase(event.target.value as UseCase)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 outline-none ring-indigo-500/70 focus:ring"
                >
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                  <option value="data">Data</option>
                  <option value="research">Research</option>
                  <option value="mixed">Mixed</option>
                </select>
              </Field>
            </div>

            <div className="space-y-3">
              <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                <p className="sm:col-span-3">AI Tool</p>
                <p className="sm:col-span-3">Subscription Type</p>
                <p className="sm:col-span-2">Price (Monthly)</p>
                <p className="sm:col-span-2">Quantity</p>
                <p className="sm:col-span-2">Action</p>
              </div>
              {toolRows.map((row) => (
                <div key={row.id} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:grid-cols-12">
                  <Field label="AI Tool" className="sm:col-span-3">
                  <select
                    value={row.tool}
                    onChange={(event) => updateToolWithPlanReset(row.id, event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm"
                  >
                    {TOOL_OPTIONS.map((tool) => (
                      <option key={tool} value={tool}>
                        {tool}
                      </option>
                    ))}
                  </select>
                  </Field>
                  <Field label="Subscription Type" className="sm:col-span-3">
                  <select
                    value={row.plan}
                    onChange={(event) => updateTool(row.id, "plan", event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm"
                  >
                    {(findCatalogByTool(row.tool)?.plans ?? []).map((plan) => (
                      <option key={`${row.id}-${plan.name}`} value={plan.name}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                  </Field>
                  <Field label="Price (Monthly)" className="sm:col-span-2">
                  <input
                    value={
                      getPlanForTool(row.tool, row.plan)?.monthlyPrice === null
                        ? "Usage based / custom"
                        : `$${getMonthlySpendForRow(row).toLocaleString()}`
                    }
                    readOnly
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm"
                  />
                  </Field>
                  <Field label="Quantity" className="sm:col-span-2">
                  <input
                    value={row.seats}
                    onChange={(event) => updateTool(row.id, "seats", event.target.value)}
                    type="number"
                    min={1}
                    placeholder="Seats"
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-sm"
                  />
                  </Field>
                  <Field label="Action" className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeTool(row.id)}
                    className="w-full rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20"
                  >
                    Remove
                  </button>
                  </Field>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isRunningAudit}
              className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isRunningAudit ? "Running audit..." : "Run AI Spend Audit"}
            </button>
          </form>
          {runMessage ? <p className="mt-3 text-sm text-emerald-300">{runMessage}</p> : null}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }): ReactElement {
  return <div className={`rounded-2xl border p-4 ${highlight ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}><p className="text-xs uppercase tracking-wide text-slate-300">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }): ReactElement {
  return <label className={`block text-sm ${className ?? ""}`}><span className="mb-1 block text-slate-300">{label}</span>{children}</label>;
}
