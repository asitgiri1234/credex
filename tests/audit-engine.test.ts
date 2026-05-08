import { describe, expect, it } from "vitest";

import { runAudit } from "@/lib/audit-engine";

describe("runAudit", () => {
  it("recommends downgrading Claude Team for a single user", () => {
    const result = runAudit({
      teamSize: 1,
      useCase: "writing",
      tools: [{ tool: "claude", plan: "team", monthlySpend: 30, seats: 1 }],
    });

    const claude = result.tools.find((toolResult) => toolResult.tool === "Claude");
    expect(claude?.recommendation).toBe("downgrade");
    expect(claude?.recommendedPlan).toBe("pro");
    expect(claude?.monthlySavings).toBe(10);
  });

  it("flags Cursor + Copilot overlap as redundant for coding workflows", () => {
    const result = runAudit({
      teamSize: 1,
      useCase: "coding",
      tools: [
        { tool: "cursor", plan: "pro", monthlySpend: 20, seats: 1 },
        { tool: "githubCopilot", plan: "individual", monthlySpend: 10, seats: 1 },
      ],
    });

    expect(result.tools.some((toolResult) => toolResult.recommendation === "redundant")).toBe(true);
  });

  it("sets credexOpportunity to true when total spend is above $500/month", () => {
    const result = runAudit({
      teamSize: 20,
      useCase: "mixed",
      tools: [
        { tool: "chatgpt", plan: "team", monthlySpend: 300, seats: 10 },
        { tool: "claude", plan: "team", monthlySpend: 300, seats: 10 },
      ],
    });

    expect(result.credexOpportunity).toBe(true);
  });

  it("keeps already optimal plans unchanged with zero savings", () => {
    const result = runAudit({
      teamSize: 1,
      useCase: "writing",
      tools: [{ tool: "claude", plan: "free", monthlySpend: 0, seats: 1 }],
    });

    const claude = result.tools.find((toolResult) => toolResult.tool === "Claude");
    expect(claude?.recommendation).toBe("optimal");
    expect(claude?.monthlySavings).toBe(0);
  });

  it("keeps annual savings aligned to monthly savings times twelve", () => {
    const result = runAudit({
      teamSize: 1,
      useCase: "coding",
      tools: [{ tool: "cursor", plan: "business", monthlySpend: 40, seats: 1 }],
    });

    result.tools.forEach((toolResult) => {
      expect(toolResult.annualSavings).toBe(toolResult.monthlySavings * 12);
    });
  });

  it("adds a Credex credits recommendation for spend above $200/month", () => {
    const result = runAudit({
      teamSize: 5,
      useCase: "mixed",
      tools: [
        { tool: "openAiApi", plan: "api", monthlySpend: 140, seats: 1 },
        { tool: "anthropicApi", plan: "api", monthlySpend: 120, seats: 1 },
      ],
    });

    const credex = result.tools.find((toolResult) => toolResult.tool === "Credex Credits");
    expect(credex).toBeDefined();
    expect(credex?.monthlySavings).toBeGreaterThan(0);
  });
});
