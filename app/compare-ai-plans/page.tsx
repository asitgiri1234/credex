"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { ToolLogo } from "@/components/compare-ai-plans/tool-logo";
import plansData from "@/lib/plans.json";

type PricingFilter = "all" | "free" | "under-10" | "under-20" | "premium";
type TypeFilter = "all" | "api" | "coding-assistant" | "chatbot" | "team-tools";
type CapabilityFilter = "all" | "image-generation" | "code-completion" | "file-upload" | "voice" | "large-context";
type UsageMode = "coding" | "writing" | "mixed";

interface PlanEntry {
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  features: string[];
}

interface ToolEntry {
  name: string;
  slug: string;
  category: string;
  type: "api" | "coding-assistant" | "chatbot";
  apiBased: boolean;
  contextWindow: string;
  requestLimits: string;
  apiPricing: string;
  teamPlan: boolean;
  enterprise: boolean;
  capabilities: string[];
  bestFor: string;
  plans: PlanEntry[];
}

interface SubscriptionInput {
  id: string;
  toolSlug: string;
  planName: string;
}

const TOOL_DATA = plansData as ToolEntry[];

const getCheapestPaidPlan = (tool: ToolEntry): PlanEntry | null => {
  const paid = tool.plans.filter((plan) => typeof plan.monthlyPrice === "number" && Number(plan.monthlyPrice) > 0);
  return paid.sort((left, right) => Number(left.monthlyPrice) - Number(right.monthlyPrice))[0] ?? null;
};

const getPlanByName = (tool: ToolEntry, planName: string): PlanEntry | undefined => {
  return tool.plans.find((plan) => plan.name === planName);
};

const formatUsd = (amount: number): string => `$${amount.toLocaleString()}`;

export default function CompareAiPlansPage(): ReactElement {
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>("all");
  const [selectedToolSlugs, setSelectedToolSlugs] = useState<string[]>(["chatgpt", "claude"]);
  const [modalToolSlug, setModalToolSlug] = useState<string | null>(null);
  const [usageMode, setUsageMode] = useState<UsageMode>("coding");
  const [calculatorRows, setCalculatorRows] = useState<SubscriptionInput[]>([
    { id: "sub-1", toolSlug: "chatgpt", planName: "Plus" },
    { id: "sub-2", toolSlug: "claude", planName: "Pro" },
    { id: "sub-3", toolSlug: "cursor", planName: "Pro" },
  ]);

  const filteredTools = useMemo(() => {
    let output = TOOL_DATA.filter((tool) => tool.name.toLowerCase().includes(search.toLowerCase()));
    if (pricingFilter !== "all") {
      output = output.filter((tool) => {
        const cheapestPaid = getCheapestPaidPlan(tool)?.monthlyPrice;
        if (pricingFilter === "free") return tool.plans.some((plan) => plan.monthlyPrice === 0);
        if (typeof cheapestPaid !== "number") return false;
        if (pricingFilter === "under-10") return cheapestPaid < 10;
        if (pricingFilter === "under-20") return cheapestPaid < 20;
        return cheapestPaid >= 20;
      });
    }
    if (typeFilter !== "all") {
      output = output.filter((tool) => (typeFilter === "team-tools" ? tool.teamPlan : tool.type === typeFilter));
    }
    if (capabilityFilter !== "all") {
      output = output.filter((tool) => tool.capabilities.includes(capabilityFilter));
    }
    return output;
  }, [search, pricingFilter, typeFilter, capabilityFilter]);

  const selectedTools = useMemo(
    () => selectedToolSlugs.map((slug) => TOOL_DATA.find((tool) => tool.slug === slug)).filter((tool): tool is ToolEntry => Boolean(tool)),
    [selectedToolSlugs],
  );

  const quickStats = useMemo(() => {
    const freePlans = TOOL_DATA.filter((tool) => tool.plans.some((plan) => plan.monthlyPrice === 0)).length;
    const cheapest = TOOL_DATA.map((tool) => getCheapestPaidPlan(tool)?.monthlyPrice).filter((price): price is number => typeof price === "number").sort((a, b) => a - b)[0] ?? 0;
    return { totalTools: TOOL_DATA.length, cheapestPaid: cheapest, freePlans };
  }, []);

  const comparisonRows = useMemo(
    () => [
      { label: "Free Plan", values: selectedTools.map((tool) => (tool.plans.some((plan) => plan.monthlyPrice === 0) ? "Yes" : "No")) },
      { label: "Cheapest Paid Plan", values: selectedTools.map((tool) => { const plan = getCheapestPaidPlan(tool); return plan ? `${plan.name} (${formatUsd(Number(plan.monthlyPrice))}/mo)` : "Custom only"; }) },
      { label: "Monthly Cost", values: selectedTools.map((tool) => { const amount = getCheapestPaidPlan(tool)?.monthlyPrice; return typeof amount === "number" ? formatUsd(amount) : "Custom"; }) },
      { label: "Annual Cost", values: selectedTools.map((tool) => { const amount = getCheapestPaidPlan(tool)?.yearlyPrice; return typeof amount === "number" ? `${formatUsd(amount)}/yr` : "N/A"; }) },
      { label: "API Pricing", values: selectedTools.map((tool) => tool.apiPricing) },
      { label: "Request/token limits", values: selectedTools.map((tool) => tool.requestLimits) },
      { label: "Context window", values: selectedTools.map((tool) => tool.contextWindow) },
      { label: "Team plans", values: selectedTools.map((tool) => (tool.teamPlan ? "Yes" : "No")) },
      { label: "Enterprise availability", values: selectedTools.map((tool) => (tool.enterprise ? "Yes" : "No")) },
      { label: "File uploads", values: selectedTools.map((tool) => (tool.capabilities.includes("file-upload") ? "Yes" : "No")) },
      { label: "Image generation", values: selectedTools.map((tool) => (tool.capabilities.includes("image-generation") ? "Yes" : "No")) },
      { label: "Code support", values: selectedTools.map((tool) => (tool.capabilities.includes("code-completion") ? "Yes" : "No")) },
      { label: "Voice support", values: selectedTools.map((tool) => (tool.capabilities.includes("voice") ? "Yes" : "No")) },
      { label: "Web browsing", values: selectedTools.map((tool) => (tool.capabilities.includes("web-browsing") ? "Yes" : "No")) },
      { label: "Best for", values: selectedTools.map((tool) => tool.bestFor) },
    ],
    [selectedTools],
  );

  const calculatorSummary = useMemo(() => {
    const monthly = calculatorRows.reduce((total, row) => {
      const tool = TOOL_DATA.find((entry) => entry.slug === row.toolSlug);
      const plan = tool ? getPlanByName(tool, row.planName) : undefined;
      return total + (typeof plan?.monthlyPrice === "number" ? Number(plan.monthlyPrice) : 0);
    }, 0);
    return { monthly, annual: monthly * 12 };
  }, [calculatorRows]);

  const overlapInsight = useMemo(() => {
    const overlapping = selectedTools.filter((tool) => tool.type === "chatbot");
    if (overlapping.length < 2) return null;
    const overlapCost = overlapping.reduce((sum, tool) => sum + (getCheapestPaidPlan(tool)?.monthlyPrice ?? 0), 0);
    const cheapest = overlapping.map((tool) => getCheapestPaidPlan(tool)?.monthlyPrice ?? Number.MAX_SAFE_INTEGER).sort((a, b) => a - b)[0];
    return { message: `You selected ${overlapping.map((tool) => tool.name).join(", ")}. Feature overlap detected across chat + coding + file analysis.`, waste: Math.max(0, overlapCost - cheapest) };
  }, [selectedTools]);

  const smartRecommendation = useMemo(() => {
    const selectedNames = new Set(selectedTools.map((tool) => tool.name));
    if (selectedNames.has("Claude") && selectedNames.has("ChatGPT") && usageMode === "coding") return "You use Claude + ChatGPT and selected coding as your primary workflow. Consider Cursor + one chatbot to reduce overlap.";
    if (selectedTools.some((tool) => tool.apiBased) && selectedTools.some((tool) => !tool.apiBased)) return "You are paying for API + subscription products together. Pay-as-you-go may be cheaper for low volume workloads.";
    if (calculatorSummary.monthly > 60) return "Current tool mix is on the premium side. Keep the highest-usage tool and cancel low-usage overlaps.";
    return "Your selected stack looks balanced. Use the comparison table to optimize by capability.";
  }, [selectedTools, usageMode, calculatorSummary.monthly]);

  const modalTool = modalToolSlug ? TOOL_DATA.find((tool) => tool.slug === modalToolSlug) ?? null : null;

  const toggleCompareTool = (toolSlug: string): void => {
    setSelectedToolSlugs((current) => (current.includes(toolSlug) ? current.filter((slug) => slug !== toolSlug) : [...current, toolSlug]));
  };

  const addCalculatorRow = (): void => setCalculatorRows((current) => [...current, { id: crypto.randomUUID(), toolSlug: "chatgpt", planName: "Plus" }]);
  const updateCalculatorTool = (id: string, toolSlug: string): void => {
    const tool = TOOL_DATA.find((entry) => entry.slug === toolSlug);
    setCalculatorRows((current) => current.map((row) => (row.id === id ? { ...row, toolSlug, planName: tool?.plans[0]?.name ?? "" } : row)));
  };
  const updateCalculatorPlan = (id: string, planName: string): void => setCalculatorRows((current) => current.map((row) => (row.id === id ? { ...row, planName } : row)));
  const removeCalculatorRow = (id: string): void => setCalculatorRows((current) => current.filter((row) => row.id !== id));

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Subscription optimizer</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            Compare AI plans with intent
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
            Search tools, filter by how you work, and see overlap before you commit to another subscription.
          </p>
        </div>

        <section className="mx-auto mt-14 max-w-5xl surface-card p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="tool-search" className="eyebrow">
                Search
              </label>
              <input
                id="tool-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search AI tools"
                className="input-product mt-3"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-primary shrink-0"
            >
              Compare plans
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Tools in catalog" value={String(quickStats.totalTools)} />
            <Stat label="Lowest paid tier" value={`${formatUsd(quickStats.cheapestPaid)}/mo`} />
            <Stat label="Tools with a free tier" value={String(quickStats.freePlans)} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-5xl surface-muted p-6 sm:p-8">
          <p className="eyebrow">Filters</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <select
              value={pricingFilter}
              onChange={(event) => setPricingFilter(event.target.value as PricingFilter)}
              className="input-product"
            >
              <option value="all">Pricing — All</option>
              <option value="free">Free tier</option>
              <option value="under-10">Under $10/mo</option>
              <option value="under-20">Under $20/mo</option>
              <option value="premium">$20/mo and up</option>
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="input-product"
            >
              <option value="all">Type — All</option>
              <option value="api">API</option>
              <option value="coding-assistant">Coding assistant</option>
              <option value="chatbot">Chat assistant</option>
              <option value="team-tools">Team-ready</option>
            </select>
            <select
              value={capabilityFilter}
              onChange={(event) => setCapabilityFilter(event.target.value as CapabilityFilter)}
              className="input-product"
            >
              <option value="all">Capability — All</option>
              <option value="image-generation">Image generation</option>
              <option value="code-completion">Code completion</option>
              <option value="file-upload">File upload</option>
              <option value="voice">Voice</option>
              <option value="large-context">Large context</option>
            </select>
          </div>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <article key={tool.slug} className="surface-card flex flex-col p-6">
              <div className="flex items-start gap-3">
                <ToolLogo slug={tool.slug} name={tool.name} />
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{tool.name}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{tool.category}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                From{" "}
                {getCheapestPaidPlan(tool)?.monthlyPrice
                  ? `${formatUsd(Number(getCheapestPaidPlan(tool)?.monthlyPrice))}/month`
                  : "custom pricing"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Free tier: {tool.plans.some((plan) => plan.monthlyPrice === 0) ? "Yes" : "No"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleCompareTool(tool.slug)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    selectedToolSlugs.includes(tool.slug)
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {selectedToolSlugs.includes(tool.slug) ? "In comparison" : "Add to compare"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalToolSlug(tool.slug)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  View plans
                </button>
              </div>
            </article>
          ))}
        </section>

        <section id="comparison-table" className="mx-auto mt-16 max-w-5xl scroll-mt-28 surface-card overflow-hidden p-0">
          <div className="border-b border-border px-8 py-6 sm:px-10">
            <h2 className="section-title">Comparison</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Sticky header on wide screens. Scroll horizontally on smaller viewports.
            </p>
          </div>
          {selectedTools.length === 0 ? (
            <p className="px-8 py-10 text-sm text-muted-foreground sm:px-10">Add at least one tool to build a comparison.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-14 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-4 text-[13px] font-semibold text-foreground">Feature</th>
                    {selectedTools.map((tool) => (
                      <th
                        key={tool.slug}
                        className="whitespace-nowrap px-6 py-4 text-[13px] font-semibold text-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ToolLogo slug={tool.slug} name={tool.name} compact />
                          <span>{tool.name}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-background/50">
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.label}-${selectedTools[index]?.slug ?? index}`} className="px-6 py-3.5 text-muted-foreground">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mx-auto mt-12 max-w-5xl surface-card p-8 sm:p-10">
          <h2 className="section-title">Savings insights</h2>
          {overlapInsight ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-2xl border border-amber-500/35 bg-amber-950/40 px-5 py-4 text-sm leading-relaxed text-amber-100/90">
                {overlapInsight.message}
              </p>
              <p className="rounded-2xl border border-red-500/35 bg-red-950/35 px-5 py-4 text-sm font-medium text-red-200">
                Estimated overlap waste: {formatUsd(overlapInsight.waste)}/month
              </p>
              <p className="rounded-2xl border border-emerald-500/35 bg-emerald-950/35 px-5 py-4 text-sm font-semibold text-emerald-100">
                Recommendation: keep the best-fit product; pause redundant chat subscriptions.
              </p>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
              No strong overlap signal from your current selection. Add another chat assistant to test redundancy.
            </p>
          )}
        </section>

        <section className="mx-auto mt-12 max-w-5xl surface-card p-8 sm:p-10">
          <h2 className="section-title">Subscription calculator</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Line items use catalog prices. Usage-based rows show as custom until you add usage estimates.
          </p>
          <div className="mt-8 space-y-4">
            {calculatorRows.map((row) => {
              const tool = TOOL_DATA.find((entry) => entry.slug === row.toolSlug);
              const plan = tool ? getPlanByName(tool, row.planName) : undefined;
              return (
                <div key={row.id} className="grid gap-3 sm:grid-cols-12 sm:items-center">
                  <select
                    value={row.toolSlug}
                    onChange={(event) => updateCalculatorTool(row.id, event.target.value)}
                    className="input-product sm:col-span-4"
                  >
                    {TOOL_DATA.map((toolEntry) => (
                      <option key={toolEntry.slug} value={toolEntry.slug}>
                        {toolEntry.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.planName}
                    onChange={(event) => updateCalculatorPlan(row.id, event.target.value)}
                    className="input-product sm:col-span-4"
                  >
                    {(tool?.plans ?? []).map((toolPlan) => (
                      <option key={`${row.id}-${toolPlan.name}`} value={toolPlan.name}>
                        {toolPlan.name}
                      </option>
                    ))}
                  </select>
                  <input
                    readOnly
                    value={typeof plan?.monthlyPrice === "number" ? `${formatUsd(Number(plan.monthlyPrice))}/month` : "Custom / usage"}
                    className="input-product bg-muted/40 text-muted-foreground sm:col-span-3"
                  />
                  <button
                    type="button"
                    onClick={() => removeCalculatorRow(row.id)}
                    className="rounded-full border border-border py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted sm:col-span-1"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addCalculatorRow} className="btn-secondary">
              Add subscription
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/25 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatUsd(calculatorSummary.monthly)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/25 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Annual</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatUsd(calculatorSummary.annual)}</p>
            </div>
          </div>
          <p className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-950/30 px-5 py-4 text-sm leading-relaxed text-emerald-100/90">
            A lean stack (one chat product + one coding assistant) often cuts redundant spend by up to{" "}
            {formatUsd(Math.round(calculatorSummary.monthly * 0.3))}/month — validate against your real usage.
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-5xl surface-muted p-8 sm:p-10">
          <h2 className="section-title">Recommendations</h2>
          <div className="mt-6">
            <label htmlFor="usage-mode" className="text-[13px] font-medium text-muted-foreground">
              Primary usage
            </label>
            <select
              id="usage-mode"
              value={usageMode}
              onChange={(event) => setUsageMode(event.target.value as UsageMode)}
              className="input-product mt-2 max-w-xs"
            >
              <option value="coding">Coding</option>
              <option value="writing">Writing</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <p className="mt-6 rounded-2xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground">
            {smartRecommendation}
          </p>
        </section>
      </main>

      {modalTool ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
              <h3 id="modal-title" className="flex min-w-0 items-center gap-3 text-lg font-semibold tracking-tight text-foreground">
                <ToolLogo slug={modalTool.slug} name={modalTool.name} />
                <span className="truncate">{modalTool.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalToolSlug(null)}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-6">
              {modalTool.plans.map((plan) => (
                <div key={`${modalTool.slug}-${plan.name}`} className="rounded-2xl border border-border bg-muted/20 p-5">
                  <h4 className="text-base font-semibold text-foreground">{plan.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {typeof plan.monthlyPrice === "number" ? `${formatUsd(Number(plan.monthlyPrice))}/month` : "Custom / usage-based"}
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={`${plan.name}-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-border bg-muted/25 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
    </div>
  );
}
