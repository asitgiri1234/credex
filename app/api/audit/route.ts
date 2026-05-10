import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit-engine";
import { buildAuditInputFromUi, clampSeats, clampTeamSize } from "@/lib/audit-bridge";
import { generateAuditNarrative } from "@/lib/ai-summary";
import { saveAuditSession } from "@/lib/audit-session-store";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getCatalogMonthlySpend } from "@/lib/subscription-spend";
import type { UseCase } from "@/lib/audit-engine";

const USE_CASES: UseCase[] = ["coding", "writing", "data", "research", "mixed"];

interface AuditRequestBody {
  teamSize?: string | number;
  useCase?: string;
  toolRows?: Array<{
    tool?: string;
    plan?: string;
    seats?: string | number;
    monthlySpend?: number;
  }>;
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const limited = rateLimit(`audit:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many audit requests. Try again shortly." }, { status: 429 });
  }

  let body: AuditRequestBody;
  try {
    body = (await request.json()) as AuditRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const useCase = body.useCase as UseCase;
  if (!useCase || !USE_CASES.includes(useCase)) {
    return NextResponse.json({ error: "Invalid or missing useCase." }, { status: 400 });
  }

  const teamSize = clampTeamSize(body.teamSize ?? 1);
  const rawRows = Array.isArray(body.toolRows) ? body.toolRows : [];
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "Add at least one subscription line item before running the audit." }, { status: 400 });
  }

  const rows = rawRows
    .map((row) => {
      if (!row.tool || !row.plan) {
        return null;
      }
      const seats = clampSeats(row.seats ?? 1);
      const monthlySpend = getCatalogMonthlySpend(row.tool, row.plan, seats);
      return {
        tool: row.tool,
        plan: row.plan,
        monthlySpend,
        seats,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const modeledSpendTotal = rows.reduce((sum, row) => sum + row.monthlySpend, 0);
  if (modeledSpendTotal <= 0) {
    return NextResponse.json(
      {
        error:
          "At least one row must have non-zero modeled spend (pick a paid catalog plan or add seats). Usage-only rows are not enough to benchmark fixed subscriptions.",
      },
      { status: 400 },
    );
  }

  const { input, warnings } = buildAuditInputFromUi(String(teamSize), useCase, rows);
  if (input.tools.length === 0) {
    return NextResponse.json(
      { error: "No tools could be audited. Check plan names against the catalog.", warnings },
      { status: 400 },
    );
  }

  const result = runAudit(input);
  const { text: narrative, source: narrativeSource } = await generateAuditNarrative(input, result);
  const resultWithSummary = { ...result, summary: narrative };

  saveAuditSession({
    auditId: result.auditId,
    input,
    result: resultWithSummary,
    narrative,
    narrativeSource,
    warnings,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    auditId: result.auditId,
    input,
    result: resultWithSummary,
    narrative,
    narrativeSource,
    warnings,
  });
}
