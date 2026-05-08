export type PlanCategory = "free" | "individual" | "developer" | "api" | "team" | "enterprise";

export type ToolSlug =
  | "cursor"
  | "openai-api"
  | "claude-api"
  | "windsurf"
  | "github-copilot"
  | "claude"
  | "chatgpt"
  | "gemini";

export interface SubscriptionPlan {
  name: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  usageLimits: string;
  keyFeatures: string[];
  bestFor: string;
  category: PlanCategory;
}

export interface ToolPlanCatalog {
  slug: ToolSlug;
  name: string;
  icon: string;
  description: string;
  isApiTool: boolean;
  plans: SubscriptionPlan[];
}

export interface StoredSubscription {
  tool: string;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export const SUBSCRIPTION_PLANS: ToolPlanCatalog[] = [
  {
    slug: "cursor",
    name: "Cursor",
    icon: "⌨️",
    description: "AI-first code editor for developer productivity.",
    isApiTool: false,
    plans: [
      { name: "Hobby", monthlyPrice: 0, yearlyPrice: 0, usageLimits: "Starter usage", keyFeatures: ["Basic code generation"], bestFor: "Casual coders", category: "free" },
      { name: "Pro", monthlyPrice: 20, yearlyPrice: 192, usageLimits: "Higher request quota", keyFeatures: ["Advanced completion", "Agent workflows"], bestFor: "Solo developers", category: "developer" },
      { name: "Business", monthlyPrice: 40, yearlyPrice: 480, usageLimits: "Seat-based with org controls", keyFeatures: ["Admin controls", "Team governance"], bestFor: "Engineering teams", category: "team" },
      { name: "Enterprise", monthlyPrice: null, yearlyPrice: null, usageLimits: "Custom contract limits", keyFeatures: ["SSO", "Security review"], bestFor: "Large organizations", category: "enterprise" },
    ],
  },
  {
    slug: "openai-api",
    name: "OpenAI API",
    icon: "🧠",
    description: "Pay-as-you-go API access for OpenAI models.",
    isApiTool: true,
    plans: [
      { name: "Pay-as-you-go", monthlyPrice: null, yearlyPrice: null, usageLimits: "Token-based, usage metered", keyFeatures: ["Model-level billing", "No fixed seat fee"], bestFor: "API builders", category: "api" },
      { name: "Model pricing breakdown", monthlyPrice: null, yearlyPrice: null, usageLimits: "Depends on model tier", keyFeatures: ["GPT-4o placeholder", "Embedding placeholder"], bestFor: "Cost-sensitive teams", category: "api" },
    ],
  },
  {
    slug: "claude-api",
    name: "Claude API",
    icon: "🤖",
    description: "Anthropic API with usage-based billing.",
    isApiTool: true,
    plans: [
      { name: "Pay-as-you-go", monthlyPrice: null, yearlyPrice: null, usageLimits: "Token-based usage caps", keyFeatures: ["Prompt + completion metering"], bestFor: "Product builders", category: "api" },
      { name: "Model pricing breakdown", monthlyPrice: null, yearlyPrice: null, usageLimits: "Varies by model", keyFeatures: ["Sonnet placeholder", "Haiku placeholder"], bestFor: "FinOps teams", category: "api" },
    ],
  },
  {
    slug: "windsurf",
    name: "Windsurf",
    icon: "🌊",
    description: "AI coding assistant with strong value pricing.",
    isApiTool: false,
    plans: [
      { name: "Free", monthlyPrice: 0, yearlyPrice: 0, usageLimits: "Limited premium credits", keyFeatures: ["Basic coding help"], bestFor: "Learners", category: "free" },
      { name: "Pro", monthlyPrice: 15, yearlyPrice: 144, usageLimits: "Expanded monthly credits", keyFeatures: ["Premium models", "Faster responses"], bestFor: "Developers", category: "developer" },
      { name: "Teams", monthlyPrice: 35, yearlyPrice: 420, usageLimits: "Seat-based team collaboration", keyFeatures: ["Team workspace", "Admin controls"], bestFor: "Small teams", category: "team" },
    ],
  },
  {
    slug: "github-copilot",
    name: "GitHub Copilot",
    icon: "🐙",
    description: "AI pair programmer embedded into GitHub ecosystem.",
    isApiTool: false,
    plans: [
      { name: "Individual", monthlyPrice: 10, yearlyPrice: 100, usageLimits: "Single user license", keyFeatures: ["Inline suggestions"], bestFor: "Solo developers", category: "individual" },
      { name: "Business", monthlyPrice: 19, yearlyPrice: 228, usageLimits: "Per-seat plan", keyFeatures: ["Policy controls", "Org management"], bestFor: "Developer teams", category: "team" },
      { name: "Enterprise", monthlyPrice: 39, yearlyPrice: 468, usageLimits: "Enterprise compliance setup", keyFeatures: ["Governance", "Advanced admin"], bestFor: "Large engineering orgs", category: "enterprise" },
    ],
  },
  {
    slug: "claude",
    name: "Claude",
    icon: "📝",
    description: "Conversation-first assistant for research and writing.",
    isApiTool: false,
    plans: [
      { name: "Free", monthlyPrice: 0, yearlyPrice: 0, usageLimits: "Entry-level usage limits", keyFeatures: ["Basic Claude access"], bestFor: "Light users", category: "free" },
      { name: "Pro", monthlyPrice: 20, yearlyPrice: 204, usageLimits: "Higher message limits", keyFeatures: ["Priority access", "Advanced models"], bestFor: "Professionals", category: "individual" },
      { name: "Team", monthlyPrice: 30, yearlyPrice: 300, usageLimits: "Per-user team plan", keyFeatures: ["Workspace collaboration"], bestFor: "Small teams", category: "team" },
      { name: "Enterprise", monthlyPrice: null, yearlyPrice: null, usageLimits: "Custom contract", keyFeatures: ["Security + governance"], bestFor: "Enterprises", category: "enterprise" },
    ],
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    icon: "💬",
    description: "General purpose AI assistant for work and ideation.",
    isApiTool: false,
    plans: [
      { name: "Free", monthlyPrice: 0, yearlyPrice: 0, usageLimits: "Limited access", keyFeatures: ["Core chat access"], bestFor: "Casual users", category: "free" },
      { name: "Plus", monthlyPrice: 20, yearlyPrice: 240, usageLimits: "Higher usage caps", keyFeatures: ["Priority model access"], bestFor: "Power users", category: "individual" },
      { name: "Team", monthlyPrice: 30, yearlyPrice: 300, usageLimits: "Per-seat team collaboration", keyFeatures: ["Shared workspace", "Admin controls"], bestFor: "Startups", category: "team" },
      { name: "Enterprise", monthlyPrice: null, yearlyPrice: null, usageLimits: "Contract limits", keyFeatures: ["Compliance and controls"], bestFor: "Large companies", category: "enterprise" },
    ],
  },
  {
    slug: "gemini",
    name: "Gemini",
    icon: "✨",
    description: "Google AI assistant with consumer and premium tiers.",
    isApiTool: false,
    plans: [
      { name: "Free", monthlyPrice: 0, yearlyPrice: 0, usageLimits: "Limited high-tier access", keyFeatures: ["Basic model access"], bestFor: "General users", category: "free" },
      { name: "Pro", monthlyPrice: 20, yearlyPrice: 192, usageLimits: "Expanded premium usage", keyFeatures: ["Premium model quality"], bestFor: "Professionals", category: "individual" },
      { name: "Ultra", monthlyPrice: 25, yearlyPrice: 252, usageLimits: "Highest consumer quota", keyFeatures: ["Top tier model access"], bestFor: "Heavy users", category: "developer" },
      { name: "Enterprise", monthlyPrice: null, yearlyPrice: null, usageLimits: "Custom", keyFeatures: ["Org controls"], bestFor: "Enterprise teams", category: "enterprise" },
    ],
  },
];
