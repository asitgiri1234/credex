import { NextResponse } from "next/server";
import type { AuditInput, AuditResult, UseCase } from "@/lib/audit-engine";
import { generateAuditNarrative } from "@/lib/ai-summary";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

interface SummaryBody {
  input?: AuditInput;
  result?: AuditResult;
}

const USE_CASES: UseCase[] = ["coding", "writing", "data", "research", "mixed"];

function isAuditInput(value: unknown): value is AuditInput {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as AuditInput;
  return (
    typeof v.teamSize === "number" &&
    USE_CASES.includes(v.useCase) &&
    Array.isArray(v.tools)
  );
}

function isAuditResult(value: unknown): value is AuditResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as AuditResult;
  return Array.isArray(v.tools) && typeof v.totalMonthlySavings === "number";
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const limited = rateLimit(`summary:${ip}`, 36, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many summary requests." }, { status: 429 });
  }

  let body: SummaryBody;
  try {
    body = (await request.json()) as SummaryBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAuditInput(body.input) || !isAuditResult(body.result)) {
    return NextResponse.json({ error: "Malformed input or result." }, { status: 400 });
  }

  const { text, source } = await generateAuditNarrative(body.input, body.result);
  return NextResponse.json({ summary: text, source });
}
