/**
 * Official pricing pages for list-price benchmarks shown in the product.
 * Figures in-catalog are snapshots for modeling; always verify live vendor pricing.
 */
export const OFFICIAL_PRICING_SOURCES: ReadonlyArray<{ tool: string; url: string }> = [
  { tool: "Cursor", url: "https://cursor.com/pricing" },
  { tool: "GitHub Copilot", url: "https://github.com/features/copilot/plans" },
  { tool: "ChatGPT", url: "https://openai.com/chatgpt/pricing" },
  { tool: "Claude (consumer)", url: "https://www.anthropic.com/pricing" },
  { tool: "OpenAI API", url: "https://openai.com/api/pricing" },
  { tool: "Anthropic API", url: "https://www.anthropic.com/pricing#api" },
  { tool: "Gemini / Google AI", url: "https://one.google.com/about/google-ai-plans/" },
  { tool: "Windsurf", url: "https://windsurf.com/pricing" },
  { tool: "Perplexity", url: "https://www.perplexity.ai/hub/pricing" },
  { tool: "Notion AI", url: "https://www.notion.so/pricing" },
  { tool: "Midjourney", url: "https://docs.midjourney.com/hc/en-us/articles/32020258789387-Plans" },
  { tool: "Runway", url: "https://runwayml.com/pricing" },
  { tool: "ElevenLabs", url: "https://elevenlabs.io/pricing" },
  { tool: "Jasper", url: "https://www.jasper.ai/pricing" },
  { tool: "Replit", url: "https://replit.com/pricing" },
  { tool: "Vercel v0", url: "https://v0.dev/pricing" },
  { tool: "Bolt.new", url: "https://bolt.new/pricing" },
  { tool: "Lovable", url: "https://lovable.dev/pricing" },
  { tool: "Tabnine", url: "https://www.tabnine.com/pricing/" },
] as const;
