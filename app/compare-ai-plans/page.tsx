"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
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
  logo: string;
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6">
          <h1 className="text-3xl font-semibold sm:text-4xl">Compare AI Plans</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Find the right AI subscription and eliminate overlap spend before it hits your monthly burn.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search AI tools" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-indigo-500/60 focus:ring" />
            <button onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Compare Plans</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Total tools compared" value={String(quickStats.totalTools)} />
            <Stat label="Cheapest paid plan" value={`${formatUsd(quickStats.cheapestPaid)}/month`} />
            <Stat label="Free plans available" value={String(quickStats.freePlans)} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={pricingFilter} onChange={(event) => setPricingFilter(event.target.value as PricingFilter)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="all">Pricing: All</option><option value="free">Pricing: Free</option><option value="under-10">Pricing: Under $10</option><option value="under-20">Pricing: Under $20</option><option value="premium">Pricing: Premium</option></select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="all">Type: All</option><option value="api">API</option><option value="coding-assistant">Coding assistant</option><option value="chatbot">Chatbot</option><option value="team-tools">Team tools</option></select>
            <select value={capabilityFilter} onChange={(event) => setCapabilityFilter(event.target.value as CapabilityFilter)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="all">Capabilities: All</option><option value="image-generation">Image generation</option><option value="code-completion">Code completion</option><option value="file-upload">File upload</option><option value="voice">Voice</option><option value="large-context">Large context</option></select>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <article key={tool.slug} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center gap-2"><span className="text-2xl">{tool.logo}</span><h3 className="text-lg font-semibold">{tool.name}</h3></div>
              <p className="mb-2 inline-flex rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">{tool.category}</p>
              <p className="text-sm text-slate-300">Starts at {getCheapestPaidPlan(tool)?.monthlyPrice ? `${formatUsd(Number(getCheapestPaidPlan(tool)?.monthlyPrice))}/month` : "Custom"}</p>
              <p className="text-sm text-slate-300">Free plan available: {tool.plans.some((plan) => plan.monthlyPrice === 0) ? "Yes" : "No"}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => toggleCompareTool(tool.slug)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedToolSlugs.includes(tool.slug) ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-white"}`}>{selectedToolSlugs.includes(tool.slug) ? "Added" : "Add to Compare"}</button>
                <button onClick={() => setModalToolSlug(tool.slug)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">View Plans</button>
              </div>
            </article>
          ))}
        </section>

        <section id="comparison-table" className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-xl font-semibold">Comparison Table</h2>
          {selectedTools.length === 0 ? (
            <p className="text-sm text-slate-300">Add at least one tool to compare.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-800/90"><tr><th className="px-3 py-2">Feature</th>{selectedTools.map((tool) => <th key={tool.slug} className="px-3 py-2">{tool.name}</th>)}</tr></thead>
                <tbody>{comparisonRows.map((row) => (<tr key={row.label} className="border-t border-white/10"><td className="px-3 py-2 font-medium">{row.label}</td>{row.values.map((value, index) => <td key={`${row.label}-${selectedTools[index]?.slug ?? index}`} className="px-3 py-2 text-slate-300">{value}</td>)}</tr>))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-xl font-semibold">Savings Insights</h2>
          {overlapInsight ? (
            <div className="space-y-2">
              <p className="rounded-lg border border-orange-400/40 bg-orange-500/10 p-3 text-sm text-orange-200">{overlapInsight.message}</p>
              <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">Estimated overlap waste: {formatUsd(overlapInsight.waste)}/month</p>
              <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">Recommendation: Keep one, cancel two.</p>
            </div>
          ) : (
            <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">No strong overlap detected from selected tools.</p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-xl font-semibold">Subscription Calculator</h2>
          <div className="space-y-3">
            {calculatorRows.map((row) => {
              const tool = TOOL_DATA.find((entry) => entry.slug === row.toolSlug);
              const plan = tool ? getPlanByName(tool, row.planName) : undefined;
              return (
                <div key={row.id} className="grid gap-2 sm:grid-cols-12">
                  <select value={row.toolSlug} onChange={(event) => updateCalculatorTool(row.id, event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm sm:col-span-4">{TOOL_DATA.map((toolEntry) => <option key={toolEntry.slug} value={toolEntry.slug}>{toolEntry.name}</option>)}</select>
                  <select value={row.planName} onChange={(event) => updateCalculatorPlan(row.id, event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm sm:col-span-4">{(tool?.plans ?? []).map((toolPlan) => <option key={`${row.id}-${toolPlan.name}`} value={toolPlan.name}>{toolPlan.name}</option>)}</select>
                  <input readOnly value={typeof plan?.monthlyPrice === "number" ? `${formatUsd(Number(plan.monthlyPrice))}/month` : "Custom / usage"} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm sm:col-span-3" />
                  <button onClick={() => removeCalculatorRow(row.id)} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 sm:col-span-1">X</button>
                </div>
              );
            })}
            <button onClick={addCalculatorRow} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold">+ Add Subscription</button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <p className="rounded-lg border border-white/10 bg-slate-800/60 p-3 text-sm">Total spend: {formatUsd(calculatorSummary.monthly)}/month</p>
            <p className="rounded-lg border border-white/10 bg-slate-800/60 p-3 text-sm">Annual spend: {formatUsd(calculatorSummary.annual)}/year</p>
          </div>
          <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Savings suggestion: Switching to one chatbot + one coding assistant can reduce redundant spend by up to {formatUsd(Math.round(calculatorSummary.monthly * 0.3))}/month.</p>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-xl font-semibold">Smart Recommendations</h2>
          <div className="mb-3"><label className="mb-1 block text-sm text-slate-300">Primary usage</label><select value={usageMode} onChange={(event) => setUsageMode(event.target.value as UsageMode)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="coding">Coding</option><option value="writing">Writing</option><option value="mixed">Mixed</option></select></div>
          <p className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 p-3 text-sm text-indigo-100">{smartRecommendation}</p>
        </section>
      </main>

      {modalTool ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-semibold">{modalTool.name} Plan Breakdown</h3><button onClick={() => setModalToolSlug(null)} className="rounded-lg bg-slate-800 px-3 py-1 text-sm">Close</button></div>
            <div className="space-y-3">{modalTool.plans.map((plan) => (<div key={`${modalTool.slug}-${plan.name}`} className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><h4 className="text-lg font-semibold">{plan.name}</h4><p className="text-sm text-slate-300">Monthly: {typeof plan.monthlyPrice === "number" ? formatUsd(Number(plan.monthlyPrice)) : "Custom / usage"}</p><ul className="mt-2 list-disc pl-5 text-sm text-slate-300">{plan.features.map((feature) => <li key={`${plan.name}-${feature}`}>{feature}</li>)}</ul></div>))}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
