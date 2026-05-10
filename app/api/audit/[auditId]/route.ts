import { NextResponse } from "next/server";
import { getAuditSession } from "@/lib/audit-session-store";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: { auditId: string } };

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const ip = getClientIp(request);
  const limited = rateLimit(`audit-read:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const auditId = context.params.auditId;
  if (!auditId || auditId.length > 200) {
    return NextResponse.json({ error: "Invalid audit id." }, { status: 400 });
  }

  const data = getAuditSession(auditId);
  if (!data) {
    return NextResponse.json({ error: "Audit not found or expired." }, { status: 404 });
  }

  return NextResponse.json({
    auditId: data.auditId,
    input: data.input,
    result: data.result,
    narrative: data.narrative,
    narrativeSource: data.narrativeSource,
    warnings: data.warnings,
  });
}
