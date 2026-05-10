import { PRICING, type PlanPrice, type ToolName } from "@/lib/pricing-data";

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";
export type Recommendation = "downgrade" | "switch" | "optimal" | "redundant";
export type Priority = "high" | "medium" | "low";

export interface ToolInput {
  tool: ToolName;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface AuditInput {
  teamSize: number;
  useCase: UseCase;
  tools: ToolInput[];
}

export interface ToolAuditResult {
  tool: string;
  currentPlan: string;
  currentSpend: number;
  recommendation: Recommendation;
  recommendedAction: string;
  recommendedPlan?: string;
  estimatedNewSpend: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
  priority: Priority;
}

export interface AuditResult {
  tools: ToolAuditResult[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  credexOpportunity: boolean;
  summary: string;
  auditId: string;
  createdAt: string;
}

interface CandidateAction {
  recommendation: Recommendation;
  recommendedAction: string;
  recommendedPlan?: string;
  estimatedNewSpend: number;
  reasoning: string;
}

const TOOL_LABELS: Record<ToolName, string> = {
  cursor: "Cursor",
  githubCopilot: "GitHub Copilot",
  claude: "Claude",
  chatgpt: "ChatGPT",
  anthropicApi: "Anthropic API",
  openAiApi: "OpenAI API",
  gemini: "Gemini",
  windsurf: "Windsurf",
  perplexity: "Perplexity",
  notionAi: "Notion AI",
  midjourney: "Midjourney",
  runway: "Runway",
  elevenLabs: "ElevenLabs",
  jasper: "Jasper",
  replit: "Replit",
  v0: "v0",
  bolt: "Bolt.new",
  lovable: "Lovable",
  tabnine: "Tabnine",
};

const CROSS_TOOL_BASELINE: Record<UseCase, { plan: string; monthly: number; reason: string }> = {
  coding: {
    plan: "Windsurf Pro",
    monthly: 15,
    reason: "For most coding teams, Windsurf Pro covers core code-assist workflows at the lowest fixed cost.",
  },
  writing: {
    plan: "Claude Pro",
    monthly: 20,
    reason: "Claude Pro is usually enough for writing-heavy usage with predictable monthly spend.",
  },
  data: {
    plan: "ChatGPT Team",
    monthly: 30,
    reason: "Data workflows generally need broader tool coverage and higher limits than single-user plans.",
  },
  research: {
    plan: "Claude Pro",
    monthly: 20,
    reason: "Research workloads typically benefit from Claude's long-context strength without team-tier costs.",
  },
  mixed: {
    plan: "ChatGPT Team",
    monthly: 30,
    reason: "Mixed usage needs multimodal coverage and collaboration features from a shared team plan.",
  },
};

const buildAuditId = (): string => {
  const randomChunk = Math.random().toString(36).slice(2, 10);
  return `audit_${Date.now()}_${randomChunk}`;
};

const getPlanConfig = (tool: ToolName, plan: string): PlanPrice | undefined => {
  const toolPlans = PRICING[tool] as Record<string, PlanPrice>;
  return toolPlans[plan];
};

const getPlanUnitPrice = (tool: ToolName, plan: string): number | null => {
  const planConfig = getPlanConfig(tool, plan);
  if (!planConfig) {
    return null;
  }
  return planConfig.monthly;
};

const calculateExpectedPlanSpend = (input: ToolInput): number | null => {
  const planConfig = getPlanConfig(input.tool, input.plan);
  if (!planConfig || planConfig.monthly === null) {
    return null;
  }

  if (planConfig.pricingModel === "perSeat") {
    return planConfig.monthly * Math.max(1, input.seats);
  }

  return planConfig.monthly;
};

const isPlanFitForTeam = (input: ToolInput, teamSize: number): boolean => {
  const planConfig = getPlanConfig(input.tool, input.plan);
  if (!planConfig) {
    return true;
  }

  if (planConfig.minTeamSize && teamSize < planConfig.minTeamSize) {
    return false;
  }
  if (planConfig.maxTeamSize && teamSize > planConfig.maxTeamSize) {
    return false;
  }

  return true;
};

const findCheapestPlanForTeam = (tool: ToolName, teamSize: number): { plan: string; spend: number } | null => {
  const toolPlans = PRICING[tool];
  const candidates = Object.entries(toolPlans)
    .map(([planName, config]) => ({ planName, config }))
    .filter(({ config }) => config.monthly !== null && config.pricingModel !== "usage")
    .filter(({ config }) => {
      const tooSmall = Boolean(config.minTeamSize && teamSize < config.minTeamSize);
      const tooLarge = Boolean(config.maxTeamSize && teamSize > config.maxTeamSize);
      return !tooSmall && !tooLarge;
    })
    .map(({ planName, config }) => ({
      plan: planName,
      spend: config.pricingModel === "perSeat" ? Number(config.monthly) * Math.max(1, teamSize) : Number(config.monthly),
    }))
    .sort((left, right) => left.spend - right.spend);

  return candidates[0] ?? null;
};

const buildActionForTool = (input: ToolInput, teamSize: number, useCase: UseCase): CandidateAction => {
  const expectedSpend = calculateExpectedPlanSpend(input) ?? input.monthlySpend;
  const baseline = CROSS_TOOL_BASELINE[useCase];

  if (input.tool === "claude" && input.plan === "team" && teamSize <= 2 && input.monthlySpend > 20) {
    return {
      recommendation: "downgrade",
      recommendedPlan: "pro",
      estimatedNewSpend: 20,
      recommendedAction: "Downgrade Claude Team to Claude Pro for a 1-2 person setup.",
      reasoning: "Claude Team is designed for multi-user collaboration; Pro keeps core capabilities at lower cost for a very small team.",
    };
  }

  if (!isPlanFitForTeam(input, teamSize)) {
    const fallbackPlan = findCheapestPlanForTeam(input.tool, teamSize);
    if (fallbackPlan && fallbackPlan.spend < input.monthlySpend) {
      return {
        recommendation: "downgrade",
        recommendedPlan: fallbackPlan.plan,
        estimatedNewSpend: fallbackPlan.spend,
        recommendedAction: `Move from ${input.plan} to ${fallbackPlan.plan} to match team size (${teamSize}) and avoid overpaying.`,
        reasoning: `${TOOL_LABELS[input.tool]} ${input.plan} is mismatched for a ${teamSize}-person team. ${fallbackPlan.plan} covers the same vendor workflow at lower cost.`,
      };
    }
  }

  const cheaperSameVendorPlan = findCheapestPlanForTeam(input.tool, teamSize);
  if (
    cheaperSameVendorPlan &&
    cheaperSameVendorPlan.plan !== input.plan &&
    cheaperSameVendorPlan.spend < Math.min(input.monthlySpend, expectedSpend)
  ) {
    return {
      recommendation: "downgrade",
      recommendedPlan: cheaperSameVendorPlan.plan,
      estimatedNewSpend: cheaperSameVendorPlan.spend,
      recommendedAction: `Downgrade to ${cheaperSameVendorPlan.plan}; same vendor fit with lower recurring spend.`,
      reasoning: `A lower-priced ${TOOL_LABELS[input.tool]} plan satisfies your team profile and saves without migration risk.`,
    };
  }

  if (baseline.monthly < input.monthlySpend && input.tool !== "anthropicApi" && input.tool !== "openAiApi") {
    return {
      recommendation: "switch",
      recommendedPlan: baseline.plan,
      estimatedNewSpend: baseline.monthly,
      recommendedAction: `Consider switching to ${baseline.plan} as a lower-cost primary option.`,
      reasoning: baseline.reason,
    };
  }

  return {
    recommendation: "optimal",
    estimatedNewSpend: input.monthlySpend,
    recommendedAction: "Keep the current setup; no defensible cheaper option found for your profile.",
    reasoning: `Current ${TOOL_LABELS[input.tool]} spend appears efficient for your use case and team size.`,
  };
};

const markRedundantCodingTools = (results: ToolAuditResult[], input: AuditInput): ToolAuditResult[] => {
  if (input.useCase !== "coding" && input.useCase !== "mixed") {
    return results;
  }

  const codingTools = ["cursor", "githubCopilot", "windsurf"] as const;
  const present = input.tools.filter((toolInput) => codingTools.includes(toolInput.tool as (typeof codingTools)[number]));
  if (present.length < 2) {
    return results;
  }

  const mostExpensive = present
    .slice()
    .sort((left, right) => right.monthlySpend - left.monthlySpend)[0];

  return results.map((result) => {
    if (result.tool !== TOOL_LABELS[mostExpensive.tool]) {
      return result;
    }

    const newSpend = 0;
    const monthlySavings = Math.max(0, result.currentSpend - newSpend);
    return {
      ...result,
      recommendation: "redundant",
      recommendedAction: `Consolidate coding seats into your other coding assistant to remove overlap.`,
      estimatedNewSpend: newSpend,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      reasoning: `${result.tool} overlaps with another coding assistant in your stack; keeping both usually duplicates spend.`,
      priority: monthlySavings >= 100 ? "high" : "medium",
    };
  });
};

const getPriority = (monthlySavings: number): Priority => {
  if (monthlySavings >= 150) {
    return "high";
  }
  if (monthlySavings >= 40) {
    return "medium";
  }
  return "low";
};

export const runAudit = (input: AuditInput): AuditResult => {
  const baseResults = input.tools.map((toolInput): ToolAuditResult => {
    const action = buildActionForTool(toolInput, input.teamSize, input.useCase);
    const monthlySavings = Math.max(0, toolInput.monthlySpend - action.estimatedNewSpend);

    return {
      tool: TOOL_LABELS[toolInput.tool],
      currentPlan: toolInput.plan,
      currentSpend: toolInput.monthlySpend,
      recommendation: action.recommendation,
      recommendedAction: action.recommendedAction,
      recommendedPlan: action.recommendedPlan,
      estimatedNewSpend: action.estimatedNewSpend,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      reasoning: action.reasoning,
      priority: getPriority(monthlySavings),
    };
  });

  const withRedundancyChecks = markRedundantCodingTools(baseResults, input);
  const totalMonthlySpend = input.tools.reduce((sum, toolInput) => sum + toolInput.monthlySpend, 0);

  const includeCredexCredits = totalMonthlySpend > 200;
  const credexCreditsSavings = includeCredexCredits ? Math.round(totalMonthlySpend * 0.2) : 0;

  const finalTools = includeCredexCredits
    ? [
        ...withRedundancyChecks,
        {
          tool: "Credex Credits",
          currentPlan: "Direct billing",
          currentSpend: totalMonthlySpend,
          recommendation: "switch",
          recommendedAction: "Route eligible API/model spend via Credex credits for negotiated discounts.",
          recommendedPlan: "Credex credits portfolio",
          estimatedNewSpend: totalMonthlySpend - credexCreditsSavings,
          monthlySavings: credexCreditsSavings,
          annualSavings: credexCreditsSavings * 12,
          reasoning:
            "Your spend level qualifies for credit aggregation. Typical discount bands are 15-30%; this audit uses a conservative 20% midpoint.",
          priority: getPriority(credexCreditsSavings),
        } satisfies ToolAuditResult,
      ]
    : withRedundancyChecks;

  const adjustedMonthlySavings = finalTools.reduce((sum, result) => sum + result.monthlySavings, 0);

  return {
    tools: finalTools,
    totalMonthlySavings: adjustedMonthlySavings,
    totalAnnualSavings: adjustedMonthlySavings * 12,
    credexOpportunity: totalMonthlySpend > 500,
    summary: "",
    auditId: buildAuditId(),
    createdAt: new Date().toISOString(),
  };
};

export const isKnownPlan = (tool: ToolName, plan: string): boolean => {
  return Object.keys(PRICING[tool]).includes(plan);
};

export const estimatePlanSpend = (tool: ToolName, plan: string, seats: number): number | null => {
  const unitPrice = getPlanUnitPrice(tool, plan);
  if (unitPrice === null) {
    return null;
  }

  const planConfig = getPlanConfig(tool, plan);
  if (!planConfig) {
    return null;
  }
  return planConfig.pricingModel === "perSeat" ? unitPrice * Math.max(1, seats) : unitPrice;
};
