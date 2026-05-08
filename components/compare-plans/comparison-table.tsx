import type { SubscriptionPlan } from "@/lib/subscription-plans";
import type { ReactElement } from "react";

export interface CompareEntry {
  toolName: string;
  plan: SubscriptionPlan;
}

interface ComparisonTableProps {
  selected: CompareEntry[];
}

const renderPrice = (value: number | null): string => {
  if (value === null) {
    return "Custom / usage";
  }
  return `₹${Math.round(value * 83).toLocaleString()}`;
};

export function ComparisonTable({ selected }: ComparisonTableProps): ReactElement {
  if (selected.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-300">
        Select plans from any tool card to compare them side-by-side.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Tool</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Monthly Cost</th>
              <th className="px-4 py-3 font-semibold">Annual Cost</th>
              <th className="px-4 py-3 font-semibold">Limits</th>
              <th className="px-4 py-3 font-semibold">Features</th>
              <th className="px-4 py-3 font-semibold">Ideal User</th>
            </tr>
          </thead>
          <tbody>
            {selected.map(({ toolName, plan }) => (
              <tr key={`${toolName}-${plan.name}`} className="border-t border-white/10 text-slate-200">
                <td className="px-4 py-3">{toolName}</td>
                <td className="px-4 py-3">{plan.name}</td>
                <td className="px-4 py-3">{renderPrice(plan.monthlyPrice)}</td>
                <td className="px-4 py-3">{renderPrice(plan.yearlyPrice)}</td>
                <td className="px-4 py-3">{plan.usageLimits}</td>
                <td className="px-4 py-3">{plan.keyFeatures.join(", ")}</td>
                <td className="px-4 py-3">{plan.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
