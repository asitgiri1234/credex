import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

interface ToolEntryLike {
  tool: string;
  plan: string;
}

/** Next catalog line item that is not already present (tool + plan). Prefers first paid tier. */
export function suggestNextStackRow(existing: ToolEntryLike[]): { tool: string; plan: string; seats: string } | null {
  const keys = new Set(existing.map((r) => `${r.tool}|${r.plan}`));
  for (const catalog of SUBSCRIPTION_PLANS) {
    const paid = catalog.plans.find((p) => p.monthlyPrice !== null && Number(p.monthlyPrice) > 0);
    const fallback = catalog.plans[0];
    const plan = paid ?? fallback;
    if (!plan) {
      continue;
    }
    const key = `${catalog.name}|${plan.name}`;
    if (!keys.has(key)) {
      return { tool: catalog.name, plan: plan.name, seats: "1" };
    }
  }
  return null;
}
