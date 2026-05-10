import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { AuditInput, AuditResult, UseCase } from "@/lib/audit-engine";
import { buildShareablePayload } from "@/lib/share-sanitize";
import { saveSharePayload } from "@/lib/share-store";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

interface ShareBody {
  auditId?: string;
  input?: AuditInput;
  result?: AuditResult;
  narrative?: string;
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
    Array.isArray(v.tools) &&
    v.tools.every(
      (t) =>
        t &&
        typeof t.tool === "string" &&
        typeof t.plan === "string" &&
        typeof t.monthlySpend === "number" &&
        typeof t.seats === "number",
    )
  );
}

function isAuditResult(value: unknown): value is AuditResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as AuditResult;
  return (
    Array.isArray(v.tools) &&
    typeof v.totalMonthlySavings === "number" &&
    typeof v.totalAnnualSavings === "number" &&
    typeof v.credexOpportunity === "boolean" &&
    typeof v.auditId === "string" &&
    typeof v.createdAt === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const limited = rateLimit(`share:${ip}`, 24, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many share link requests." }, { status: 429 });
  }

  let body: ShareBody;
  try {
    body = (await request.json()) as ShareBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAuditInput(body.input) || !isAuditResult(body.result)) {
    return NextResponse.json({ error: "Malformed audit payload." }, { status: 400 });
  }

  const narrative = typeof body.narrative === "string" ? body.narrative : body.result.summary || "";
  const shareId = randomUUID();
  const createdAt = new Date().toISOString();

  const safe = buildShareablePayload(body.result.auditId, body.input, body.result, narrative, createdAt);
  saveSharePayload(shareId, safe);

  const urlPath = `/r/${shareId}`;
  return NextResponse.json({ shareId, path: urlPath, urlPath });
}
