export type ToolName =
  | "cursor"
  | "githubCopilot"
  | "claude"
  | "chatgpt"
  | "anthropicApi"
  | "openAiApi"
  | "gemini"
  | "windsurf"
  | "perplexity"
  | "notionAi"
  | "midjourney"
  | "runway"
  | "elevenLabs"
  | "jasper"
  | "replit"
  | "v0"
  | "bolt"
  | "lovable"
  | "tabnine";

export interface PlanPrice {
  monthly: number | null;
  annualMonthly: number | null;
  pricingModel: "flat" | "perSeat" | "usage" | "custom";
  minTeamSize?: number;
  maxTeamSize?: number;
  supportsUseCases: ("coding" | "writing" | "data" | "research" | "mixed")[];
}

export const PRICING = {
  cursor: {
    hobby: {
      monthly: 0,
      annualMonthly: 0,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["coding", "mixed"],
    },
    pro: {
      monthly: 20,
      annualMonthly: 16,
      pricingModel: "flat",
      maxTeamSize: 5,
      supportsUseCases: ["coding", "mixed"],
      // $20/mo — https://cursor.com/pricing — verified 2026-05-08
    },
    business: {
      monthly: 40,
      annualMonthly: 40,
      pricingModel: "perSeat",
      minTeamSize: 3,
      supportsUseCases: ["coding", "mixed"],
      // $40/user/mo — https://cursor.com/pricing — verified 2026-05-08
    },
    enterprise: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "custom",
      minTeamSize: 25,
      supportsUseCases: ["coding", "mixed"],
      // Enterprise custom pricing — https://cursor.com/pricing — verified 2026-05-08
    },
  },
  githubCopilot: {
    individual: {
      monthly: 10,
      annualMonthly: 10,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["coding", "mixed"],
      // $10/mo — https://github.com/features/copilot/plans — verified 2026-05-08
    },
    business: {
      monthly: 19,
      annualMonthly: 19,
      pricingModel: "perSeat",
      minTeamSize: 2,
      supportsUseCases: ["coding", "mixed"],
      // $19/user/mo — https://github.com/features/copilot/plans — verified 2026-05-08
    },
    enterprise: {
      monthly: 39,
      annualMonthly: 39,
      pricingModel: "perSeat",
      minTeamSize: 25,
      supportsUseCases: ["coding", "mixed"],
      // $39/user/mo — https://github.com/features/copilot/plans — verified 2026-05-08
    },
  },
  claude: {
    free: {
      monthly: 0,
      annualMonthly: 0,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["writing", "research", "mixed"],
    },
    pro: {
      monthly: 20,
      annualMonthly: 17,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
      // $20/mo — https://www.anthropic.com/pricing — verified 2026-05-08
    },
    max: {
      monthly: 100,
      annualMonthly: 100,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
      // $100/mo — https://www.anthropic.com/pricing — verified 2026-05-08
    },
    team: {
      monthly: 30,
      annualMonthly: 25,
      pricingModel: "perSeat",
      minTeamSize: 3,
      supportsUseCases: ["writing", "research", "mixed"],
      // $30/user/mo — https://www.anthropic.com/pricing — verified 2026-05-08
    },
    enterprise: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "custom",
      minTeamSize: 25,
      supportsUseCases: ["writing", "research", "mixed"],
    },
    apiDirect: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "usage",
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
    },
  },
  chatgpt: {
    free: {
      monthly: 0,
      annualMonthly: 0,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
    },
    plus: {
      monthly: 20,
      annualMonthly: 20,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
      // $20/mo — https://openai.com/chatgpt/pricing — verified 2026-05-08
    },
    team: {
      monthly: 30,
      annualMonthly: 25,
      pricingModel: "perSeat",
      minTeamSize: 2,
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
      // $30/user/mo monthly plan — https://openai.com/chatgpt/pricing — verified 2026-05-08
    },
    enterprise: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "custom",
      minTeamSize: 25,
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
    },
    apiDirect: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "usage",
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
    },
  },
  anthropicApi: {
    api: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "usage",
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
      // Usage-based token pricing — https://www.anthropic.com/pricing#api — verified 2026-05-08
    },
  },
  openAiApi: {
    api: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "usage",
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
      // Usage-based token pricing — https://openai.com/api/pricing — verified 2026-05-08
    },
  },
  gemini: {
    free: {
      monthly: 0,
      annualMonthly: 0,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
    },
    pro: {
      monthly: 20,
      annualMonthly: 16,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
      // Public Gemini paid plan benchmark — https://one.google.com/about/google-ai-plans/ — verified 2026-05-08
    },
    ultra: {
      monthly: 25,
      annualMonthly: 21,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["writing", "research", "mixed"],
      // Public Gemini premium plan benchmark — https://one.google.com/about/google-ai-plans/ — verified 2026-05-08
    },
    api: {
      monthly: null,
      annualMonthly: null,
      pricingModel: "usage",
      supportsUseCases: ["coding", "writing", "data", "research", "mixed"],
    },
  },
  windsurf: {
    free: {
      monthly: 0,
      annualMonthly: 0,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["coding", "mixed"],
    },
    pro: {
      monthly: 15,
      annualMonthly: 12,
      pricingModel: "flat",
      maxTeamSize: 5,
      supportsUseCases: ["coding", "mixed"],
      // $15/mo — https://windsurf.com/pricing — verified 2026-05-08
    },
    teams: {
      monthly: 35,
      annualMonthly: 35,
      pricingModel: "perSeat",
      minTeamSize: 3,
      supportsUseCases: ["coding", "mixed"],
      // $35/user/mo — https://windsurf.com/pricing — verified 2026-05-08
    },
  },
  perplexity: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["research", "mixed"] },
    pro: {
      monthly: 20,
      annualMonthly: 20,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["research", "mixed", "coding"],
      // Consumer Pro benchmark — https://www.perplexity.ai/hub/pricing — verify live
    },
    enterprise: { monthly: null, annualMonthly: null, pricingModel: "custom", minTeamSize: 10, supportsUseCases: ["research", "data", "mixed"] },
  },
  notionAi: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 5, supportsUseCases: ["writing", "mixed"] },
    plus: {
      monthly: 12,
      annualMonthly: 10,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["writing", "mixed"],
      // Plus + AI add-on modeled as bundled bench — https://www.notion.so/pricing — verify live
    },
    business: {
      monthly: 20,
      annualMonthly: 18,
      pricingModel: "perSeat",
      minTeamSize: 2,
      supportsUseCases: ["writing", "data", "mixed"],
    },
  },
  midjourney: {
    basic: {
      monthly: 10,
      annualMonthly: 10,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["mixed"],
      // Plan tiers — https://docs.midjourney.com/hc/en-us/articles/32020258789387-Plans — verify live
    },
    standard: { monthly: 30, annualMonthly: 30, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["mixed"] },
    pro: { monthly: 60, annualMonthly: 60, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["mixed"] },
  },
  runway: {
    basic: {
      monthly: 15,
      annualMonthly: 12,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["mixed"],
      // https://runwayml.com/pricing — verify live
    },
    standard: { monthly: 35, annualMonthly: 35, pricingModel: "flat", maxTeamSize: 2, supportsUseCases: ["mixed"] },
    pro: { monthly: 95, annualMonthly: 95, pricingModel: "flat", minTeamSize: 1, supportsUseCases: ["mixed"] },
  },
  elevenLabs: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["mixed"] },
    starter: {
      monthly: 5,
      annualMonthly: 5,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["mixed"],
      // https://elevenlabs.io/pricing — verify live
    },
    creator: { monthly: 22, annualMonthly: 22, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["mixed"] },
  },
  jasper: {
    creator: {
      monthly: 49,
      annualMonthly: 39,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["writing", "mixed"],
      // https://www.jasper.ai/pricing — verify live
    },
    teams: { monthly: 125, annualMonthly: 99, pricingModel: "flat", minTeamSize: 2, supportsUseCases: ["writing", "mixed"] },
  },
  replit: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 3, supportsUseCases: ["coding", "mixed"] },
    core: {
      monthly: 20,
      annualMonthly: 15,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["coding", "mixed"],
      // https://replit.com/pricing — verify live
    },
    teams: { monthly: 40, annualMonthly: 40, pricingModel: "perSeat", minTeamSize: 2, supportsUseCases: ["coding", "mixed"] },
  },
  v0: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["coding", "mixed"] },
    premium: {
      monthly: 20,
      annualMonthly: 20,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["coding", "mixed"],
      // Modeled from Vercel v0 pricing page — https://v0.dev/pricing — verify live
    },
  },
  bolt: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["coding", "mixed"] },
    pro: {
      monthly: 25,
      annualMonthly: 25,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["coding", "mixed"],
      // Placeholder bench vs StackBlitz Bolt — https://bolt.new/pricing — verify live
    },
  },
  lovable: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 1, supportsUseCases: ["coding", "mixed"] },
    pro: {
      monthly: 25,
      annualMonthly: 25,
      pricingModel: "flat",
      maxTeamSize: 2,
      supportsUseCases: ["coding", "mixed"],
      // https://lovable.dev/pricing — verify live
    },
  },
  tabnine: {
    free: { monthly: 0, annualMonthly: 0, pricingModel: "flat", maxTeamSize: 5, supportsUseCases: ["coding", "mixed"] },
    pro: {
      monthly: 12,
      annualMonthly: 12,
      pricingModel: "flat",
      maxTeamSize: 1,
      supportsUseCases: ["coding", "mixed"],
      // https://www.tabnine.com/pricing/ — verify live
    },
    enterprise: { monthly: null, annualMonthly: null, pricingModel: "custom", minTeamSize: 25, supportsUseCases: ["coding", "mixed"] },
  },
} as const satisfies Record<ToolName, Record<string, PlanPrice>>;
