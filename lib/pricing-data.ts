export type ToolName =
  | "cursor"
  | "githubCopilot"
  | "claude"
  | "chatgpt"
  | "anthropicApi"
  | "openAiApi"
  | "gemini"
  | "windsurf";

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
} as const satisfies Record<ToolName, Record<string, PlanPrice>>;
