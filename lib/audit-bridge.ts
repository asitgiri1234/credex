import type { AuditInput, UseCase } from "@/lib/audit-engine";
import type { ToolName } from "@/lib/pricing-data";
import { isKnownPlan } from "@/lib/audit-engine";

export const DISPLAY_TOOL_TO_AUDIT_TOOL: Record<string, ToolName> = {
  Cursor: "cursor",
  "GitHub Copilot": "githubCopilot",
  Claude: "claude",
  ChatGPT: "chatgpt",
  Gemini: "gemini",
  Windsurf: "windsurf",
  "OpenAI API": "openAiApi",
  "Claude API": "anthropicApi",
  Perplexity: "perplexity",
  "Notion AI": "notionAi",
  Midjourney: "midjourney",
  Runway: "runway",
  ElevenLabs: "elevenLabs",
  Jasper: "jasper",
  Replit: "replit",
  v0: "v0",
  "Bolt.new": "bolt",
  Lovable: "lovable",
  Tabnine: "tabnine",
};

export function clampSeats(raw: string | number): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(Math.floor(n), 10_000);
}

export function clampTeamSize(raw: string | number): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(Math.floor(n), 50_000);
}

/** Maps catalog display plan names to pricing-data keys (e.g. "Plus" → "plus"). */
export function displayPlanToPricingKey(tool: ToolName, planDisplay: string): string {
  if (tool === "openAiApi" || tool === "anthropicApi") {
    return "api";
  }
  const lower = planDisplay.trim().toLowerCase();
  if (lower.includes("pay-as-you-go") || lower.includes("pay as you go")) {
    return "api";
  }
  if (lower.includes("model pricing")) {
    return "api";
  }
  const compact = lower.replace(/[^a-z0-9]/g, "");
  if (compact === "teams" && tool === "windsurf") {
    return "teams";
  }
  return compact;
}

export interface UiToolRow {
  tool: string;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export function buildAuditInputFromUi(
  teamSizeRaw: string,
  useCase: UseCase,
  rows: UiToolRow[],
): { input: AuditInput; warnings: string[] } {
  const warnings: string[] = [];
  const teamSize = clampTeamSize(teamSizeRaw);
  const tools = rows
    .map((row) => {
      const tool = DISPLAY_TOOL_TO_AUDIT_TOOL[row.tool];
      if (!tool) {
        warnings.push(`Unknown tool "${row.tool}" — row skipped.`);
        return null;
      }
      const planKey = displayPlanToPricingKey(tool, row.plan);
      if (!isKnownPlan(tool, planKey)) {
        warnings.push(`${row.tool} / ${row.plan} is not in the audit catalog — row skipped.`);
        return null;
      }
      const seats = clampSeats(row.seats);
      const monthlySpend = Math.max(0, row.monthlySpend);
      return { tool, plan: planKey, monthlySpend, seats };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    input: { teamSize, useCase, tools },
    warnings,
  };
}
