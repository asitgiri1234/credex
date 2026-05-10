"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { ToolLogo } from "@/components/compare-ai-plans/tool-logo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { OFFICIAL_PRICING_SOURCES } from "@/lib/pricing-sources";
import { getWinningColumnIndices } from "@/lib/comparison-winners";
import { useMoneyFormatter } from "@/lib/hooks/use-money-formatter";
import {
  compareModeToUseCase,
  loadCredexStack,
  mergeCalculatorWithPreviousSeats,
  saveCredexStack,
  toolDisplayNameToSlug,
} from "@/lib/stack-sync";
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

function getCalculatorRowMonthly(row: SubscriptionInput): number {
  const tool = TOOL_DATA.find((entry) => entry.slug === row.toolSlug);
  if (!tool) {
    return 0;
  }
  const plan = getPlanByName(tool, row.planName);
  return typeof plan?.monthlyPrice === "number" ? Number(plan.monthlyPrice) : 0;
}

export default function CompareAiPlansPage(): ReactElement {
  const { usd } = useMoneyFormatter();
  const [storageReady, setStorageReady] = useState(false);
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

  useEffect(() => {
    const stack = loadCredexStack();
    if (stack && stack.rows.length > 0) {
      const mapped = stack.rows
        .map((r) => {
          const slug = toolDisplayNameToSlug(r.toolName);
          if (!slug) {
            return null;
          }
          const tool = TOOL_DATA.find((t) => t.slug === slug);
          if (!tool) {
            return null;
          }
          const planOk = tool.plans.some((p) => p.name === r.plan);
          return {
            id: crypto.randomUUID(),
            toolSlug: tool.slug,
            planName: planOk ? r.plan : tool.plans[0]?.name ?? "",
          };
        })
        .filter((x): x is SubscriptionInput => x !== null);
      if (mapped.length > 0) {
        setCalculatorRows(mapped);
      }
      setUsageMode(stack.compareUsageMode);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    const prev = loadCredexStack();
    const usageChanged = prev != null && prev.compareUsageMode !== usageMode;
    saveCredexStack({
      v: 2,
      teamSize: prev?.teamSize ?? "5",
      useCase: usageChanged ? compareModeToUseCase(usageMode) : (prev?.useCase ?? compareModeToUseCase(usageMode)),
      compareUsageMode: usageMode,
      rows: mergeCalculatorWithPreviousSeats(calculatorRows, prev?.rows),
    });
  }, [calculatorRows, usageMode, storageReady]);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    let output = TOOL_DATA.filter((tool) => {
      if (!q) {
        return true;
      }
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.slug.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.bestFor.toLowerCase().includes(q)
      );
    });
    if (pricingFilter !== "all") {
      output = output.filter((tool) => {
        const cheapestPaid = getCheapestPaidPlan(tool)?.monthlyPrice;
        if (pricingFilter === "free") {
          return tool.plans.some((plan) => plan.monthlyPrice === 0);
        }
        if (typeof cheapestPaid !== "number") {
          return false;
        }
        if (pricingFilter === "under-10") {
          return cheapestPaid < 10;
        }
        if (pricingFilter === "under-20") {
          return cheapestPaid < 20;
        }
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
    const cheapest =
      TOOL_DATA.map((tool) => getCheapestPaidPlan(tool)?.monthlyPrice)
        .filter((price): price is number => typeof price === "number")
        .sort((a, b) => a - b)[0] ?? 0;
    return { totalTools: TOOL_DATA.length, cheapestPaid: cheapest, freePlans };
  }, []);

  const comparisonRows = useMemo(
    () => [
      { label: "Free Plan", values: selectedTools.map((tool) => (tool.plans.some((plan) => plan.monthlyPrice === 0) ? "Yes" : "No")) },
      {
        label: "Cheapest Paid Plan",
        values: selectedTools.map((tool) => {
          const plan = getCheapestPaidPlan(tool);
          return plan ? `${plan.name} (${usd(Number(plan.monthlyPrice))}/mo)` : "Custom only";
        }),
      },
      {
        label: "Monthly Cost",
        values: selectedTools.map((tool) => {
          const amount = getCheapestPaidPlan(tool)?.monthlyPrice;
          return typeof amount === "number" ? usd(amount) : "Custom";
        }),
      },
      {
        label: "Annual Cost",
        values: selectedTools.map((tool) => {
          const amount = getCheapestPaidPlan(tool)?.yearlyPrice;
          return typeof amount === "number" ? `${usd(amount)}/yr` : "N/A";
        }),
      },
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
    [selectedTools, usd],
  );

  const calculatorSummary = useMemo(() => {
    const monthly = calculatorRows.reduce((total, row) => total + getCalculatorRowMonthly(row), 0);
    return { monthly, annual: monthly * 12 };
  }, [calculatorRows]);

  const calculatorTools = useMemo(() => {
    return calculatorRows
      .map((row) => TOOL_DATA.find((t) => t.slug === row.toolSlug))
      .filter((t): t is ToolEntry => Boolean(t));
  }, [calculatorRows]);

  const calculatorOverlapInsight = useMemo(() => {
    const lines = calculatorRows.map((row) => {
      const tool = TOOL_DATA.find((t) => t.slug === row.toolSlug);
      if (!tool) {
        return null;
      }
      const monthly = getCalculatorRowMonthly(row);
      return { tool, planName: row.planName, monthly };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    const chatLines = lines.filter((l) => l.tool.type === "chatbot");
    if (chatLines.length < 2) {
      return null;
    }

    const priced = chatLines.filter((c) => c.monthly > 0);
    if (priced.length < 2) {
      return {
        waste: 0,
        headline: "Not enough paid chat rows to bound overlap.",
        detail: `The calculator lists ${chatLines.map((c) => c.tool.name).join(", ")}. This heuristic needs at least two fixed-price (non-zero) chat subscriptions—free tiers are modeled as $0/mo.`,
        methodology: "",
      };
    }

    const sum = priced.reduce((s, c) => s + c.monthly, 0);
    const min = Math.min(...priced.map((c) => c.monthly));
    const waste = Math.max(0, sum - min);
    const lineDesc = priced.map((c) => `${c.tool.name} · ${c.planName} · ${usd(c.monthly)}/mo`).join(" · ");
    const methodology = `Upper-bound overlap = sum of modeled chat subscriptions (${usd(sum)}/mo) minus the cheapest kept seat (${usd(min)}/mo) = ${usd(waste)}/mo. This assumes one chat product could cover the workflow if features overlap; it is not usage-weighted. Sources: list prices in this catalog trace to vendor pages in “Official pricing sources”.`;

    return {
      waste,
      headline: `Modeled overlap across ${priced.length} paid chat subscriptions`,
      detail: lineDesc,
      methodology,
    };
  }, [calculatorRows, usd]);

  const smartRecommendation = useMemo(() => {
    if (calculatorRows.length === 0) {
      return "Add rows to the subscription calculator—this panel only reflects tools you list there (not the comparison checkboxes).";
    }

    const names = new Set(calculatorTools.map((t) => t.name));
    const slugs = new Set(calculatorRows.map((r) => r.toolSlug));
    const chatbots = calculatorTools.filter((t) => t.type === "chatbot");
    const coding = calculatorTools.filter((t) => t.type === "coding-assistant");

    if (usageMode === "coding" && names.has("Claude") && names.has("ChatGPT")) {
      return "Calculator rows include Claude and ChatGPT with primary usage set to coding. Data-driven read: two general chat vendors often overlap with IDE-native assistants already in your rows—validate whether both chats are needed for production work.";
    }

    if (coding.length >= 2 && usageMode === "coding") {
      return `Calculator shows multiple coding assistants (${coding.map((c) => c.name).join(", ")}). For finance, document which repo or IDE each seat must use—redundant IDE AI is a common fixed-cost leak.`;
    }

    if (calculatorTools.some((t) => t.apiBased) && calculatorTools.some((t) => !t.apiBased)) {
      return "Mix of API-metered and seat-priced tools in the calculator. Low API volume can be cheaper than another seat—have engineering export last month’s token spend before adding subscriptions.";
    }

    if (chatbots.length >= 2) {
      return `Multiple chat products in the calculator (${chatbots.map((c) => c.name).join(", ")}). If one satisfies retrieval + writing, the others may be partially redundant—tie the decision to feature-level requirements, not brand.`;
    }

    if (calculatorSummary.monthly > 120) {
      return `Modeled calculator spend is ${usd(calculatorSummary.monthly)}/mo. Above ~$120/mo, portfolio discounts (e.g., Credex credits) and annual commits usually deserve a line in the business case.`;
    }

    if (slugs.size < calculatorRows.length) {
      return "Duplicate tools appear in the calculator—merge plans or remove redundant rows so recommendations map 1:1 to vendors.";
    }

    return "Stack looks diversified relative to the calculator rows you entered. Tune filters above, then align recommendations with the overlap math in Savings insights.";
  }, [calculatorRows, calculatorTools, usageMode, calculatorSummary.monthly, usd]);

  const modalTool = modalToolSlug ? (TOOL_DATA.find((tool) => tool.slug === modalToolSlug) ?? null) : null;

  const toggleCompareTool = (toolSlug: string): void => {
    setSelectedToolSlugs((current) => (current.includes(toolSlug) ? current.filter((slug) => slug !== toolSlug) : [...current, toolSlug]));
  };

  const addCalculatorRow = (): void =>
    setCalculatorRows((current) => [...current, { id: crypto.randomUUID(), toolSlug: "chatgpt", planName: "Plus" }]);

  const updateCalculatorTool = (id: string, toolSlug: string): void => {
    setCalculatorRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }
        const tool = TOOL_DATA.find((entry) => entry.slug === toolSlug);
        const plans = tool?.plans ?? [];
        const keepPlan = plans.some((p) => p.name === row.planName);
        return {
          ...row,
          toolSlug,
          planName: keepPlan ? row.planName : tool?.plans[0]?.name ?? "",
        };
      }),
    );
  };

  const showFreeTierTools = (): void => {
    setPricingFilter("free");
    setTypeFilter("all");
    setCapabilityFilter("all");
    setSearch("");
    window.requestAnimationFrame(() => {
      document.getElementById("tool-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const updateCalculatorPlan = (id: string, planName: string): void => {
    setCalculatorRows((current) => current.map((row) => (row.id === id ? { ...row, planName } : row)));
  };

  const removeCalculatorRow = (id: string): void => {
    setCalculatorRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-16">
        <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Plan catalog" }]} />
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Subscription optimizer</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            Compare AI plans with intent
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
            Search tools, filter by how you work, and see overlap before you commit to another subscription.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            The <strong className="text-foreground">subscription calculator</strong> below syncs with the home-page audit stack (same browser) so you are not maintaining two inventories.
          </p>
        </div>

        <section className="mx-auto mt-14 max-w-5xl surface-card p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="tool-search" className="eyebrow">
                Search catalog
              </label>
              <input
                id="tool-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, slug, category, or “best for”"
                className="input-product mt-3"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredTools.length}</span> of {TOOL_DATA.length} tools
                {search.trim() ? ` matching “${search.trim()}”` : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-primary shrink-0"
            >
              Jump to comparison table
            </button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Tools in catalog" value={String(quickStats.totalTools)} />
            <Stat label="Lowest paid tier" value={`${usd(quickStats.cheapestPaid)}/mo`} />
            <button
              type="button"
              onClick={showFreeTierTools}
              className="rounded-2xl border border-border bg-muted/25 px-5 py-4 text-left transition hover:border-primary/50 hover:bg-muted/50"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tools with a free tier</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground tabular-nums">{quickStats.freePlans}</p>
              <p className="mt-2 text-xs font-medium text-primary">Show in catalog →</p>
            </button>
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

        <section id="tool-grid" className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-24">
          {filteredTools.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-border bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
              No tools match this search + filters. Clear search or set filters to “All”.
            </p>
          ) : (
            filteredTools.map((tool) => (
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
                    ? `${usd(Number(getCheapestPaidPlan(tool)?.monthlyPrice))}/month`
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
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-2 border-border bg-card text-foreground hover:border-primary/45 hover:bg-muted/80"
                    }`}
                  >
                    {selectedToolSlugs.includes(tool.slug) ? "✓ In comparison" : "Add to compare"}
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
            ))
          )}
        </section>

        <section id="comparison-table" className="mx-auto mt-16 max-w-5xl scroll-mt-28 surface-card overflow-hidden p-0">
          <div className="border-b border-border px-8 py-6 sm:px-10">
            <h2 className="section-title">Comparison</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Sticky header on wide screens. Scroll horizontally on smaller viewports.{" "}
              <span className="text-foreground">Green cells</span> flag the most finance-friendly value on key price rows.
            </p>
          </div>
          {selectedTools.length === 0 ? (
            <p className="px-8 py-10 text-sm text-muted-foreground sm:px-10">Add at least one tool to build a comparison.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">
                  Side-by-side comparison of selected AI tools: pricing, limits, capabilities, and positioning.
                </caption>
                <thead className="sticky top-14 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-6 py-4 text-[13px] font-semibold text-foreground">
                      Feature
                    </th>
                    {selectedTools.map((tool) => (
                      <th
                        key={tool.slug}
                        scope="col"
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
                  {comparisonRows.map((row) => {
                    const winners = getWinningColumnIndices(row.label, row.values);
                    const showBestLabel =
                      row.label === "Monthly Cost" ||
                      row.label === "Annual Cost" ||
                      row.label === "Cheapest Paid Plan";
                    return (
                      <tr key={row.label} className="border-t border-border">
                        <th scope="row" className="px-6 py-3.5 text-left font-medium text-foreground">
                          {row.label}
                        </th>
                        {row.values.map((value, index) => {
                          const isWinner = winners?.has(index) ?? false;
                          return (
                            <td
                              key={`${row.label}-${selectedTools[index]?.slug ?? index}`}
                              className={`px-6 py-3.5 ${
                                isWinner
                                  ? "bg-emerald-500/15 font-medium text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-50"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {value}
                              {isWinner && showBestLabel ? (
                                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
                                  Best
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mx-auto mt-12 max-w-5xl surface-card p-8 sm:p-10">
          <h2 className="section-title">Savings insights</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Overlap math uses only the <strong className="text-foreground">subscription calculator</strong> rows (fixed list prices), not the comparison checkboxes.
          </p>
          {calculatorOverlapInsight ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-2xl border border-amber-500/35 bg-amber-950/40 px-5 py-4 text-sm leading-relaxed text-amber-100/90">
                {calculatorOverlapInsight.headline}
              </p>
              <p className="rounded-2xl border border-border bg-muted/25 px-5 py-4 text-sm text-muted-foreground">
                {calculatorOverlapInsight.detail}
              </p>
              {calculatorOverlapInsight.waste > 0 ? (
                <p className="rounded-2xl border border-red-500/35 bg-red-950/35 px-5 py-4 text-sm font-medium text-red-200">
                  Upper-bound overlap (modeled): {usd(calculatorOverlapInsight.waste)}/month
                </p>
              ) : null}
              {calculatorOverlapInsight.methodology ? (
                <p className="rounded-2xl border border-border bg-card px-5 py-4 text-xs leading-relaxed text-muted-foreground">
                  {calculatorOverlapInsight.methodology}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
              Add at least two <strong className="text-foreground">chat-assistant</strong> rows with non-zero monthly prices in the calculator to produce an overlap bound.
            </p>
          )}
        </section>

        <section className="mx-auto mt-12 max-w-5xl surface-card p-8 sm:p-10">
          <h2 className="section-title">Subscription calculator</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Line items use catalog prices. This list syncs to the home-page audit (tool, plan, seats preserved when possible).
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
                    tabIndex={-1}
                    aria-readonly="true"
                    title="Derived from catalog"
                    value={typeof plan?.monthlyPrice === "number" ? `${usd(Number(plan.monthlyPrice))}/month` : "Custom / usage"}
                    className="input-product cursor-default select-none bg-muted/50 text-muted-foreground sm:col-span-3"
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
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{usd(calculatorSummary.monthly)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/25 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Annual</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{usd(calculatorSummary.annual)}</p>
            </div>
          </div>
          <p className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-950/30 px-5 py-4 text-sm leading-relaxed text-emerald-100/90">
            A lean stack (one chat product + one coding assistant) often cuts redundant spend by up to{" "}
            {usd(Math.round(calculatorSummary.monthly * 0.3))}/month — validate against your real usage and vendor invoices.
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

        <section id="pricing-sources" className="mx-auto mt-12 max-w-5xl scroll-mt-24 surface-card p-8 sm:p-10">
          <h2 className="section-title">Official pricing sources</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Every fixed monthly figure in this demo traces to a vendor pricing page below. Snapshots can drift—open the link before you present numbers to finance.
          </p>
          <ul className="mt-6 columns-1 gap-x-10 text-sm sm:columns-2">
            {OFFICIAL_PRICING_SOURCES.map((s) => (
              <li key={s.url} className="mb-3 break-inside-avoid">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-4">
                  {s.tool}
                </a>
                <span className="block truncate text-xs text-muted-foreground">{s.url}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-foreground underline underline-offset-4">
              Return to spend audit
            </Link>
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
                    {typeof plan.monthlyPrice === "number" ? `${usd(Number(plan.monthlyPrice))}/month` : "Custom / usage-based"}
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
