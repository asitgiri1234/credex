import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

interface LeadBody {
  email?: string;
  name?: string;
  company?: string;
  auditId?: string;
}

const emailOk = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const limited = rateLimit(`lead:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many submissions from this network." }, { status: 429 });
  }

  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !emailOk(email)) {
    return NextResponse.json({ error: "A valid work email is required." }, { status: 400 });
  }

  const payload = {
    email,
    name: body.name?.trim() || undefined,
    company: body.company?.trim() || undefined,
    auditId: typeof body.auditId === "string" ? body.auditId : undefined,
    receivedAt: new Date().toISOString(),
    sourceIp: ip,
  };

  // MVP: no CRM hook — structured log for operators / log drains.
  console.info("[credex:lead]", JSON.stringify(payload));

  return NextResponse.json({ ok: true, message: "Thanks — we'll follow up with Credex next steps." });
}
