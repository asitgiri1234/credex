"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { runAudit } from "@/lib/audit-engine";
import type { UseCase } from "@/lib/audit-engine";
import { buildAuditInputFromUi, clampSeats, clampTeamSize } from "@/lib/audit-bridge";
import { validateSeatsString, validateTeamSizeString } from "@/lib/audit-form-validation";
import { OFFICIAL_PRICING_SOURCES } from "@/lib/pricing-sources";
import { loadCredexStack, saveCredexStack, toCompareUsageMode } from "@/lib/stack-sync";
import { suggestNextStackRow } from "@/lib/suggest-stack-row";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type ToolPlanCatalog } from "@/lib/subscription-plans";

interface ToolEntry {
  id: string;
  tool: string;
  plan: string;
  seats: string;
}

const TOOL_OPTIONS = SUBSCRIPTION_PLANS.map((tool) => tool.name);

const DEFAULT_TOOL_ROWS: ToolEntry[] = [
  { id: "1", tool: "Cursor", plan: "Pro", seats: "1" },
  { id: "2", tool: "GitHub Copilot", plan: "Business", seats: "1" },
];

const findCatalogByTool = (toolName: string): ToolPlanCatalog | undefined => {
  return SUBSCRIPTION_PLANS.find((catalog) => catalog.name === toolName);
};

const getPlanForTool = (toolName: string, planName: string): SubscriptionPlan | undefined => {
  const catalog = findCatalogByTool(toolName);
  return catalog?.plans.find((plan) => plan.name === planName);
};

const getMonthlySpendForRow = (row: ToolEntry): number => {
  const plan = getPlanForTool(row.tool, row.plan);
  const seats = clampSeats(row.seats);
  if (!plan || plan.monthlyPrice === null) {
    return 0;
  }
  return Number(plan.monthlyPrice) * seats;
};

export default function Home(): ReactElement {
  const router = useRouter();
  const [storageReady, setStorageReady] = useState(false);
  const [teamSize, setTeamSize] = useState("5");
  const [useCase, setUseCase] = useState<UseCase>("coding");
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditError, setAuditError] = useState<string>("");
  const [addToolMessage, setAddToolMessage] = useState<string>("");
  const [toolRows, setToolRows] = useState<ToolEntry[]>(DEFAULT_TOOL_ROWS);

  useEffect(() => {
    const stack = loadCredexStack();
    if (stack) {
      setTeamSize(stack.teamSize);
      setUseCase(stack.useCase);
      if (stack.rows.length > 0) {
        setToolRows(
          stack.rows.map((r) => ({
            id: crypto.randomUUID(),
            tool: r.toolName,
            plan: r.plan,
            seats: String(r.seats),
          })),
        );
      } else {
        setToolRows([]);
      }
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    saveCredexStack({
      v: 2,
      teamSize,
      useCase,
      compareUsageMode: toCompareUsageMode(useCase),
      rows: toolRows.map((row) => ({
        toolName: row.tool,
        plan: row.plan,
        seats: clampSeats(row.seats),
      })),
    });
  }, [toolRows, teamSize, useCase, storageReady]);

  const teamSizeError = validateTeamSizeString(teamSize);

  const duplicateRowIds = useMemo(() => {
    const byKey = new Map<string, string[]>();
    for (const row of toolRows) {
      const key = `${row.tool}|${row.plan}`;
      byKey.set(key, [...(byKey.get(key) ?? []), row.id]);
    }
    const dup = new Set<string>();
    for (const ids of byKey.values()) {
      if (ids.length > 1) {
        ids.forEach((id) => dup.add(id));
      }
    }
    return dup;
  }, [toolRows]);

  const rowSeatsErrors = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const row of toolRows) {
      m.set(row.id, validateSeatsString(row.seats));
    }
    return m;
  }, [toolRows]);

  const currentSpend = useMemo(() => {
    return toolRows.reduce((total, row) => total + getMonthlySpendForRow(row), 0);
  }, [toolRows]);

  const auditPreview = useMemo(() => {
    if (teamSizeError) {
      return { result: null, warnings: [] as string[] };
    }
    if (duplicateRowIds.size > 0) {
      return { result: null, warnings: [] as string[] };
    }
    if ([...rowSeatsErrors.values()].some((e) => e !== null)) {
      return { result: null, warnings: [] as string[] };
    }
    const rows = toolRows.map((row) => ({
      tool: row.tool,
      plan: row.plan,
      monthlySpend: getMonthlySpendForRow(row),
      seats: clampSeats(row.seats),
    }));
    const { input, warnings } = buildAuditInputFromUi(teamSize, useCase, rows);
    if (input.tools.length === 0) {
      return { result: null, warnings };
    }
    return { result: runAudit(input), warnings };
  }, [toolRows, teamSize, useCase, teamSizeError, duplicateRowIds, rowSeatsErrors]);

  const estimatedMonthlySavings = auditPreview.result?.totalMonthlySavings ?? 0;
  const estimatedAnnualSavings = estimatedMonthlySavings * 12;

  const hasBlockingFormIssue =
    Boolean(teamSizeError) ||
    duplicateRowIds.size > 0 ||
    [...rowSeatsErrors.values()].some((e) => e !== null) ||
    toolRows.length === 0 ||
    currentSpend <= 0;

  const updateTool = (id: string, field: keyof ToolEntry, value: string): void => {
    setToolRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const updateToolWithPlanReset = (id: string, toolName: string): void => {
    const catalog = findCatalogByTool(toolName);
    const defaultPlan = catalog?.plans[0]?.name ?? "";
    setToolRows((prev) => prev.map((row) => (row.id === id ? { ...row, tool: toolName, plan: defaultPlan } : row)));
  };

  const addTool = (): void => {
    setAddToolMessage("");
    const suggestion = suggestNextStackRow(toolRows);
    if (!suggestion) {
      setAddToolMessage("Every catalog tool + plan pair is already listed. Increase quantity on an existing row instead of duplicating.");
      return;
    }
    setToolRows((prev) => [...prev, { id: crypto.randomUUID(), ...suggestion }]);
  };

  const removeTool = (id: string): void => {
    setToolRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleRunAudit = async (): Promise<void> => {
    setIsRunningAudit(true);
    setAuditError("");

    if (toolRows.length === 0) {
      setAuditError("Add at least one subscription row.");
      setIsRunningAudit(false);
      return;
    }
    if (teamSizeError) {
      setAuditError(teamSizeError);
      setIsRunningAudit(false);
      return;
    }
    if (duplicateRowIds.size > 0) {
      setAuditError("Remove duplicate rows that share the same tool and plan, or merge quantities.");
      setIsRunningAudit(false);
      return;
    }
    const badSeat = [...rowSeatsErrors.entries()].find(([, err]) => err !== null);
    if (badSeat) {
      setAuditError(badSeat[1] ?? "Fix quantity fields.");
      setIsRunningAudit(false);
      return;
    }
    if (currentSpend <= 0) {
      setAuditError("Modeled spend is $0. Select at least one paid catalog plan (or add seats) so finance can benchmark something real.");
      setIsRunningAudit(false);
      return;
    }

    const rows = toolRows.map((row) => ({
      tool: row.tool,
      plan: row.plan,
      monthlySpend: getMonthlySpendForRow(row),
      seats: clampSeats(row.seats),
    }));

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamSize: clampTeamSize(teamSize),
          useCase,
          toolRows: rows,
        }),
      });
      const json = (await res.json()) as {
        auditId?: string;
        input?: unknown;
        result?: unknown;
        narrative?: string;
        warnings?: string[];
        error?: string;
      };

      if (!res.ok || !json.auditId || !json.input || !json.result || typeof json.narrative !== "string") {
        setAuditError(json.error ?? "Audit failed. Check your inputs and try again.");
        return;
      }

      const payload = {
        auditId: json.auditId,
        input: json.input,
        result: json.result,
        narrative: json.narrative,
        warnings: json.warnings,
      };
      sessionStorage.setItem(`credex-audit-session:${json.auditId}`, JSON.stringify(payload));
      router.push(`/audit/${json.auditId}`);
    } catch {
      setAuditError("Unable to reach the audit service. Try again.");
    } finally {
      setIsRunningAudit(false);
    }
  };

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
          <StatCard label="Estimated monthly savings" value={`$${estimatedMonthlySavings.toLocaleString()}`} emphasis />
          <StatCard label="Estimated annual savings" value={`$${estimatedAnnualSavings.toLocaleString()}`} />
        </div>

        {toolRows.length === 0 ? (
          <p className="mx-auto mt-6 max-w-4xl rounded-2xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
            No subscriptions in your stack yet. Add a row to model spend — the audit will not run on an empty stack.
          </p>
        ) : null}

        {currentSpend <= 0 && toolRows.length > 0 ? (
          <p className="mx-auto mt-6 max-w-4xl rounded-2xl border border-amber-500/30 bg-amber-950/25 px-5 py-4 text-sm text-amber-100/90">
            Modeled monthly spend is $0 (free or usage-only rows). Pick a paid plan or add seats before running the audit.
          </p>
        ) : null}

        {duplicateRowIds.size > 0 ? (
          <p className="mx-auto mt-6 max-w-4xl rounded-2xl border border-red-500/35 bg-red-950/30 px-5 py-4 text-sm text-red-200">
            Duplicate line items (same tool and plan). Finance needs one row per subscription—merge seats into a single row or pick a different plan tier.
          </p>
        ) : null}

        {auditPreview.warnings.length > 0 ? (
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-amber-500/30 bg-amber-950/25 px-5 py-4 text-sm text-amber-100/90">
            <p className="font-medium">Some rows were skipped (unknown tool or plan).</p>
            <ul className="mt-2 list-disc pl-5">
              {auditPreview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section id="audit-form" className="mx-auto mt-20 max-w-4xl scroll-mt-24 surface-card p-8 sm:p-10">
          <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Your stack</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                One row per vendor and plan. If you need more seats, raise <strong className="text-foreground">Quantity</strong>—do not duplicate the same line item. Figures trace to{" "}
                <Link href="/compare-ai-plans#pricing-sources" className="font-medium text-foreground underline underline-offset-4">
                  vendor pricing sources
                </Link>
                .
              </p>
            </div>
            <button type="button" onClick={addTool} className="btn-secondary shrink-0">
              Add tool
            </button>
          </div>
          {addToolMessage ? (
            <p className="mt-4 text-sm text-amber-200/90" role="status">
              {addToolMessage}
            </p>
          ) : null}

          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRunAudit();
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Team size" error={teamSizeError}>
                <input
                  value={teamSize}
                  onChange={(event) => setTeamSize(event.target.value)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-invalid={Boolean(teamSizeError)}
                  className={`input-product ${teamSizeError ? "border-red-500/60" : ""}`}
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
                <p className="eyebrow sm:col-span-2">Monthly (calc.)</p>
                <p className="eyebrow sm:col-span-2">Quantity</p>
                <p className="eyebrow sm:col-span-2 text-right">Remove</p>
              </div>
              {toolRows.map((row) => (
                <div
                  key={row.id}
                  className={`grid gap-4 rounded-2xl border bg-muted/25 p-4 sm:grid-cols-12 sm:items-end sm:p-5 ${
                    duplicateRowIds.has(row.id) ? "border-red-500/50" : "border-border"
                  }`}
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
                  <Field label="Monthly (calc.)" className="sm:col-span-2">
                    <input
                      value={
                        getPlanForTool(row.tool, row.plan)?.monthlyPrice === null
                          ? "Usage-based (not in fixed total)"
                          : `$${getMonthlySpendForRow(row).toLocaleString()}`
                      }
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      title="Calculated from catalog price × quantity. Not editable."
                      className="input-product cursor-default select-none bg-muted/50 text-muted-foreground"
                    />
                  </Field>
                  <Field
                    label="Quantity"
                    className="sm:col-span-2"
                    error={rowSeatsErrors.get(row.id) ?? undefined}
                  >
                    <input
                      value={row.seats}
                      onChange={(event) => updateTool(row.id, "seats", event.target.value)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      aria-invalid={Boolean(rowSeatsErrors.get(row.id))}
                      className={`input-product ${rowSeatsErrors.get(row.id) ? "border-red-500/60" : ""}`}
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

            <button
              type="submit"
              disabled={isRunningAudit || hasBlockingFormIssue || auditPreview.result === null}
              className="btn-primary mt-10 w-full sm:w-auto"
            >
              {isRunningAudit ? "Running audit…" : "Run spend audit"}
            </button>
            {auditError ? (
              <p className="mt-4 text-sm text-red-300/90" role="alert">
                {auditError}
              </p>
            ) : null}
          </form>

          <div className="mt-10 border-t border-border pt-8">
            <p className="eyebrow">Price benchmarks</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              List prices in this flow are snapshots for modeling. Verify current amounts on each vendor&apos;s official pricing page before presenting to finance.
            </p>
            <ul className="mt-4 columns-1 gap-x-8 text-sm text-muted-foreground sm:columns-2">
              {OFFICIAL_PRICING_SOURCES.slice(0, 10).map((s) => (
                <li key={s.url} className="mb-2 break-inside-avoid">
                  <a href={s.url} className="text-foreground underline underline-offset-4 hover:text-primary" target="_blank" rel="noreferrer">
                    {s.tool}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              <Link href="/compare-ai-plans#pricing-sources" className="underline underline-offset-4">
                Full source list on Compare plans
              </Link>
            </p>
          </div>
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

function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string | null;
}): ReactElement {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-red-300/90">{error}</span> : null}
    </label>
  );
}
