"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { ComparisonTable, type CompareEntry } from "@/components/compare-plans/comparison-table";
import { PlansModal } from "@/components/compare-plans/plans-modal";
import { ToolCard } from "@/components/compare-plans/tool-card";
import { buildOverlapRecommendation, matchSubscriptionsWithAlternatives } from "@/lib/subscription-optimizer";
import {
  SUBSCRIPTION_PLANS,
  type PlanCategory,
  type StoredSubscription,
  type SubscriptionPlan,
  type ToolPlanCatalog,
} from "@/lib/subscription-plans";

type FilterOption = "all" | "free-only" | "developer-tools" | "api-based" | "team-plans" | "cheapest-first";

const SUBSCRIPTIONS_STORAGE_KEY = "credex-subscriptions";

const parseStoredSubscriptions = (): StoredSubscription[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredSubscription[];
    return parsed.filter((entry) => typeof entry.monthlySpend === "number" && entry.monthlySpend >= 0);
  } catch {
    return [];
  }
};

const supportsCategory = (tool: ToolPlanCatalog, category: PlanCategory): boolean => {
  return tool.plans.some((plan) => plan.category === category);
};

export default function CompareAiPlansPage(): ReactElement {
  const [selectedTool, setSelectedTool] = useState<ToolPlanCatalog | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedPlans, setSelectedPlans] = useState<CompareEntry[]>([]);
  const [userSubscriptions] = useState<StoredSubscription[]>(() => parseStoredSubscriptions());

  const filteredPlans = useMemo(() => {
    const list = [...SUBSCRIPTION_PLANS];
    if (filter === "free-only") {
      return list.filter((tool) => supportsCategory(tool, "free"));
    }
    if (filter === "developer-tools") {
      return list.filter((tool) => tool.name === "Cursor" || tool.name === "Windsurf" || tool.name === "GitHub Copilot");
    }
    if (filter === "api-based") {
      return list.filter((tool) => tool.isApiTool);
    }
    if (filter === "team-plans") {
      return list.filter((tool) => supportsCategory(tool, "team"));
    }
    if (filter === "cheapest-first") {
      return list.sort((left, right) => {
        const leftMin = Math.min(...left.plans.map((plan) => (plan.monthlyPrice ?? Number.MAX_SAFE_INTEGER)));
        const rightMin = Math.min(...right.plans.map((plan) => (plan.monthlyPrice ?? Number.MAX_SAFE_INTEGER)));
        return leftMin - rightMin;
      });
    }
    return list;
  }, [filter]);

  const selectedPlanKeys = useMemo(() => selectedPlans.map((item) => `${item.toolName.toLowerCase()}:${item.plan.name}`), [selectedPlans]);
  const overlapRecommendation = useMemo(() => buildOverlapRecommendation(userSubscriptions), [userSubscriptions]);
  const subscriptionMatches = useMemo(() => matchSubscriptionsWithAlternatives(userSubscriptions), [userSubscriptions]);

  const toggleComparePlan = (toolName: string, plan: SubscriptionPlan): void => {
    setSelectedPlans((current) => {
      const key = `${toolName}:${plan.name}`;
      const exists = current.some((entry) => `${entry.toolName}:${entry.plan.name}` === key);
      if (exists) {
        return current.filter((entry) => `${entry.toolName}:${entry.plan.name}` !== key);
      }
      return [...current, { toolName, plan }];
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-6">
          <h1 className="text-3xl font-semibold sm:text-4xl">Compare AI Plans</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Explore plan options across leading AI tools, compare them side-by-side, and identify savings opportunities instantly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Plans" },
              { id: "free-only", label: "Free Plans Only" },
              { id: "developer-tools", label: "Developer Tools" },
              { id: "api-based", label: "API-based Tools" },
              { id: "team-plans", label: "Team Plans" },
              { id: "cheapest-first", label: "Cheapest First" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as FilterOption)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === option.id ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredPlans.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} onViewPlans={(slug) => setSelectedTool(SUBSCRIPTION_PLANS.find((entry) => entry.slug === slug) ?? null)} />
          ))}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Plan Comparison</h2>
          <ComparisonTable selected={selectedPlans} />
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-xl font-semibold">Savings Recommendations</h2>
          {overlapRecommendation ? (
            <p className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-3 text-sm text-orange-200">{overlapRecommendation}</p>
          ) : (
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              No major overlap detected in your current subscriptions.
            </p>
          )}

          {subscriptionMatches.length > 0 ? (
            <div className="space-y-2">
              {subscriptionMatches.map((match) => (
                <p key={`${match.current.tool}-${match.current.plan}`} className="rounded-lg border border-white/10 bg-slate-800/70 p-3 text-sm text-slate-200">
                  Current subscription: {match.current.tool} {match.current.plan} (₹{Math.round(match.current.monthlySpend * 83).toLocaleString()}/month)
                  {match.suggestedAlternative
                    ? ` • Alternative available: ${match.suggestedAlternative} • Potential savings ₹${Math.round(match.potentialMonthlySavings * 83).toLocaleString()}/month`
                    : " • No lower-priced direct alternative found."}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Add subscriptions from the dashboard first to auto-match alternatives here.
            </p>
          )}
        </section>
      </main>
      <PlansModal
        tool={selectedTool}
        selectedPlanKeys={selectedPlanKeys}
        onClose={() => setSelectedTool(null)}
        onToggleCompare={toggleComparePlan}
      />
    </div>
  );
}
