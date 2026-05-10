import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { clampSeats } from "@/lib/audit-bridge";

/** Mirrors home-page spend math: catalog price × seats (usage/custom → 0). */
export function getCatalogMonthlySpend(toolDisplayName: string, planDisplayName: string, seatsRaw: string | number): number {
  const catalog = SUBSCRIPTION_PLANS.find((t) => t.name === toolDisplayName);
  const plan = catalog?.plans.find((p) => p.name === planDisplayName);
  const seats = clampSeats(seatsRaw);
  if (!plan || plan.monthlyPrice === null) {
    return 0;
  }
  return Number(plan.monthlyPrice) * seats;
}
