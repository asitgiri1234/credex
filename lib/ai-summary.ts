import type { AuditInput, AuditResult } from "@/lib/audit-engine";

const WORD_TARGET = 100;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildTemplateNarrative(input: AuditInput, result: AuditResult): string {
  const spend = input.tools.reduce((s, t) => s + t.monthlySpend, 0);
  const top = [...result.tools].sort((a, b) => b.monthlySavings - a.monthlySavings)[0];
  const overlap = result.tools.filter((t) => t.recommendation === "redundant").length;
  const credex = result.credexOpportunity
    ? " Given your scale, routing negotiated spend through Credex credits is worth a short conversation."
    : "";

  const lead = `For a ${input.teamSize}-person team focused on ${input.useCase}, we modeled about $${spend.toLocaleString()}/month in catalog spend.`;
  const savings = ` Defensible moves point to roughly $${result.totalMonthlySavings.toLocaleString()}/month in savings (${Math.round(
    spend > 0 ? (result.totalMonthlySavings / spend) * 100 : 0,
  )}% of modeled spend) before behavior change.`;
  const focus = top
    ? ` The largest lever is ${top.tool}: ${top.recommendedAction}`
    : " No single outsized lever stood out—your stack may already be efficient.";
  const stack = overlap > 0 ? ` We flagged ${overlap} overlap pattern(s) where duplicate coding assistants inflate fixed cost.` : "";

  const narrative = `${lead}${savings}${focus}${stack}${credex}`.replace(/\s+/g, " ").trim();
  return narrative;
}

async function callOpenAiSummary(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return null;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "You write concise Credex audit summaries for finance stakeholders. Output a single paragraph, about 90–110 words, plain English, no markdown, no bullet points.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function generateAuditNarrative(input: AuditInput, result: AuditResult): Promise<{ text: string; source: "openai" | "template" }> {
  const toolLines = input.tools.map((t) => `- ${t.tool} / ${t.plan}: $${t.monthlySpend}/mo, seats ${t.seats}`).join("\n");
  const recLines = result.tools
    .filter((t) => t.monthlySavings > 0)
    .slice(0, 5)
    .map((t) => `- ${t.tool}: ${t.recommendedAction} (~$${t.monthlySavings}/mo)`)
    .join("\n");

  const prompt = `Team size: ${input.teamSize}. Primary use case: ${input.useCase}.
Modeled stack:
${toolLines}

Audit highlights (savings > 0):
${recLines || "- None — already efficient"}

Total modeled savings: $${result.totalMonthlySavings}/month. Credex portfolio opportunity (high spend): ${result.credexOpportunity ? "yes" : "no"}.

Write the summary paragraph now.`;

  const llm = await callOpenAiSummary(prompt);
  if (llm && countWords(llm) >= 60) {
    return { text: llm, source: "openai" };
  }

  const fallback = buildTemplateNarrative(input, result);
  let text = fallback;
  if (countWords(text) < 80) {
    text = `${text} We anchored estimates to public list prices and seat math, then applied overlap and tier-fit rules from the Credex audit engine—treat figures as directional until you validate usage.`;
  }
  if (countWords(text) > WORD_TARGET + 35) {
    const words = text.split(/\s+/);
    text = words.slice(0, WORD_TARGET + 15).join(" ").trim() + "…";
  }
  return { text, source: "template" };
}
