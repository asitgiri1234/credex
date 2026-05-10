import type { ToolName } from "@/lib/pricing-data";
import { OFFICIAL_PRICING_SOURCES } from "@/lib/pricing-sources";

/** Maps audit-engine tool keys to labels used in OFFICIAL_PRICING_SOURCES. */
const TOOL_KEY_TO_LISTING: Record<ToolName, string> = {
  cursor: "Cursor",
  githubCopilot: "GitHub Copilot",
  claude: "Claude (consumer)",
  chatgpt: "ChatGPT",
  anthropicApi: "Anthropic API",
  openAiApi: "OpenAI API",
  gemini: "Gemini / Google AI",
  windsurf: "Windsurf",
  perplexity: "Perplexity",
  notionAi: "Notion AI",
  midjourney: "Midjourney",
  runway: "Runway",
  elevenLabs: "ElevenLabs",
  jasper: "Jasper",
  replit: "Replit",
  v0: "Vercel v0",
  bolt: "Bolt.new",
  lovable: "Lovable",
  tabnine: "Tabnine",
};

export interface PricingCitation {
  label: string;
  url: string;
}

export function officialCitationForToolKey(tool: ToolName): PricingCitation | null {
  const listing = TOOL_KEY_TO_LISTING[tool];
  const row = OFFICIAL_PRICING_SOURCES.find((s) => s.tool === listing);
  if (!row) {
    return null;
  }
  return { label: `${listing} — official pricing`, url: row.url };
}
