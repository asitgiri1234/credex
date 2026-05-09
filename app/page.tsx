"use client";

import Link from "next/link";
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
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">AI spend audit</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            Are you on the wrong AI plan?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
            Map your subscriptions, see overlap risk, and estimate savings with numbers your finance team can defend.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/compare-ai-plans" className="btn-secondary">
              Compare plans
            </Link>
            <a
              href="#audit-form"
              className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground"
            >
              Start audit
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          <StatCard label="Current monthly spend" value={`$${currentSpend.toLocaleString()}`} />
          <StatCard label="Estimated monthly savings" value={`$${estimatedSavings.toLocaleString()}`} emphasis />
          <StatCard label="Estimated annual savings" value={`$${(estimatedSavings * 12).toLocaleString()}`} />
        </div>

        <section id="audit-form" className="mx-auto mt-20 max-w-4xl scroll-mt-24 surface-card p-8 sm:p-10">
          <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Your stack</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Add each paid tool once. Plans and prices follow our catalog so totals stay consistent.
              </p>
            </div>
            <button type="button" onClick={addTool} className="btn-secondary shrink-0">
              Add tool
            </button>
          </div>

          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              void runAudit();
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Team size">
                <input
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  type="number"
                  min={1}
                  className="input-product"
                />
              </Field>
              <Field label="Primary use case">
                <select
                  value={useCase}
                  onChange={(event) => setUseCase(event.target.value as UseCase)}
                  className="input-product"
                >
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                  <option value="data">Data</option>
                  <option value="research">Research</option>
                  <option value="mixed">Mixed</option>
                </select>
              </Field>
            </div>

            <div className="mt-8 space-y-4">
              <div className="hidden grid-cols-12 gap-4 px-1 sm:grid">
                <p className="eyebrow sm:col-span-3">AI tool</p>
                <p className="eyebrow sm:col-span-3">Plan</p>
                <p className="eyebrow sm:col-span-2">Price</p>
                <p className="eyebrow sm:col-span-2">Seats</p>
                <p className="eyebrow sm:col-span-2 text-right">Remove</p>
              </div>
              {toolRows.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-4 rounded-2xl border border-border bg-muted/25 p-4 sm:grid-cols-12 sm:items-end sm:p-5"
                >
                  <Field label="AI tool" className="sm:col-span-3">
                    <select
                      value={row.tool}
                      onChange={(event) => updateToolWithPlanReset(row.id, event.target.value)}
                      className="input-product"
                    >
                      {TOOL_OPTIONS.map((tool) => (
                        <option key={tool} value={tool}>
                          {tool}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Subscription" className="sm:col-span-3">
                    <select
                      value={row.plan}
                      onChange={(event) => updateTool(row.id, "plan", event.target.value)}
                      className="input-product"
                    >
                      {(findCatalogByTool(row.tool)?.plans ?? []).map((plan) => (
                        <option key={`${row.id}-${plan.name}`} value={plan.name}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Monthly (est.)" className="sm:col-span-2">
                    <input
                      value={
                        getPlanForTool(row.tool, row.plan)?.monthlyPrice === null
                          ? "Usage-based"
                          : `$${getMonthlySpendForRow(row).toLocaleString()}`
                      }
                      readOnly
                      className="input-product bg-muted/40 text-muted-foreground"
                    />
                  </Field>
                  <Field label="Quantity" className="sm:col-span-2">
                    <input
                      value={row.seats}
                      onChange={(event) => updateTool(row.id, "seats", event.target.value)}
                      type="number"
                      min={1}
                      className="input-product"
                    />
                  </Field>
                  <div className="flex sm:col-span-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => removeTool(row.id)}
                      className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition hover:bg-muted sm:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={isRunningAudit} className="btn-primary mt-10 w-full sm:w-auto">
              {isRunningAudit ? "Running audit…" : "Run spend audit"}
            </button>
            {runMessage ? (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                {runMessage}
              </p>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}): ReactElement {
  return (
    <div
      className={`surface-card px-5 py-6 ${emphasis ? "ring-1 ring-border" : ""}`}
    >
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }): ReactElement {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
