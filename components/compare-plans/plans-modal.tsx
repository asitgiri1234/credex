import { Button } from "@/components/ui/button";
import type { ReactElement } from "react";
import type { SubscriptionPlan, ToolPlanCatalog } from "@/lib/subscription-plans";

interface PlansModalProps {
  tool: ToolPlanCatalog | null;
  selectedPlanKeys: string[];
  onClose: () => void;
  onToggleCompare: (toolName: string, plan: SubscriptionPlan) => void;
}

const formatPrice = (price: number | null, fallback: string): string => {
  if (price === null) {
    return fallback;
  }
  return `₹${Math.round(price * 83).toLocaleString()}`;
};

export function PlansModal({ tool, selectedPlanKeys, onClose, onToggleCompare }: PlansModalProps): ReactElement | null {
  if (!tool) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{tool.name} Plans</h2>
            <p className="text-sm text-slate-400">{tool.description}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-3">
          {tool.plans.map((plan) => {
            const compareKey = `${tool.slug}:${plan.name}`;
            const selected = selectedPlanKeys.includes(compareKey);
            return (
              <article key={compareKey} className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
                  <Button
                    variant={selected ? "secondary" : "outline"}
                    onClick={() => onToggleCompare(tool.name, plan)}
                  >
                    {selected ? "Added to Compare" : "Add to Compare"}
                  </Button>
                </div>
                <p className="text-sm text-slate-300">
                  Monthly: {formatPrice(plan.monthlyPrice, "Usage-based / custom")} • Annual:{" "}
                  {plan.yearlyPrice !== null ? formatPrice(plan.yearlyPrice, "N/A") : "Not published"}
                </p>
                <p className="mt-2 text-sm text-slate-300">Usage limits: {plan.usageLimits}</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
                  {plan.keyFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-emerald-300">Best suited for: {plan.bestFor}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
