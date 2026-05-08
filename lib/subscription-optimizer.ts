import { SUBSCRIPTION_PLANS, type StoredSubscription, type ToolPlanCatalog } from "@/lib/subscription-plans";

export interface SubscriptionMatch {
  current: StoredSubscription;
  matchedTool?: ToolPlanCatalog;
  suggestedAlternative?: string;
  potentialMonthlySavings: number;
}

const OVERLAP_TOOLS = new Set(["chatgpt", "claude", "gemini"]);

const normalizeTool = (toolName: string): string => {
  return toolName.trim().toLowerCase().replace(/\s+/g, "");
};

const findToolCatalog = (toolName: string): ToolPlanCatalog | undefined => {
  const normalized = normalizeTool(toolName);
  return SUBSCRIPTION_PLANS.find((tool) => normalizeTool(tool.name) === normalized || normalizeTool(tool.slug) === normalized);
};

export const buildOverlapRecommendation = (subscriptions: StoredSubscription[]): string | null => {
  const overlapping = subscriptions.filter((item) => OVERLAP_TOOLS.has(normalizeTool(item.tool)));

  if (overlapping.length < 2) {
    return null;
  }

  const totalOverlap = overlapping.reduce((sum, item) => sum + item.monthlySpend, 0);
  const cheapest = overlapping.reduce((currentCheapest, nextSubscription) => {
    return nextSubscription.monthlySpend < currentCheapest.monthlySpend ? nextSubscription : currentCheapest;
  });
  const potentialSavings = Math.max(0, totalOverlap - cheapest.monthlySpend);

  const toolNames = overlapping.map((item) => `${item.tool} ${item.plan}`).join(" + ");
  return `You are paying for ${toolNames}. Consider keeping only one based on your usage to save ₹${Math.round(potentialSavings)}/month.`;
};

export const matchSubscriptionsWithAlternatives = (subscriptions: StoredSubscription[]): SubscriptionMatch[] => {
  return subscriptions.map((subscription) => {
    const toolCatalog = findToolCatalog(subscription.tool);
    if (!toolCatalog) {
      return {
        current: subscription,
        potentialMonthlySavings: 0,
      };
    }

    const cheaperPlans = toolCatalog.plans
      .filter((plan) => typeof plan.monthlyPrice === "number")
      .filter((plan) => Number(plan.monthlyPrice) < subscription.monthlySpend)
      .sort((left, right) => Number(left.monthlyPrice) - Number(right.monthlyPrice));

    const bestAlternative = cheaperPlans[0];
    if (!bestAlternative) {
      return {
        current: subscription,
        matchedTool: toolCatalog,
        potentialMonthlySavings: 0,
      };
    }

    return {
      current: subscription,
      matchedTool: toolCatalog,
      suggestedAlternative: bestAlternative.name,
      potentialMonthlySavings: Math.max(0, subscription.monthlySpend - Number(bestAlternative.monthlyPrice)),
    };
  });
};
