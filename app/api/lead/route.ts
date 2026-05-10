import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

interface LeadBody {
  email?: string;
  name?: string;
  company?: string;
  auditId?: string;
  /** Honeypot — must be empty (bots often fill hidden fields). */
  website?: string;
}

const emailOk = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 32);
}

function clampStr(s: string | undefined, max: number): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  const t = s.trim();
  if (t.length > max) {
    return t.slice(0, max);
  }
  return t || undefined;
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request);
  const limitedIp = rateLimit(`lead:ip:${ip}`, 10, 60_000);
  if (!limitedIp.ok) {
    return NextResponse.json({ error: "Too many submissions from this network." }, { status: 429 });
  }

  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.website != null && String(body.website).trim() !== "") {
    return NextResponse.json({ ok: true, message: "Thanks — we'll follow up with Credex next steps." });
  }

  const emailRaw = body.email?.trim().toLowerCase() ?? "";
  if (!emailRaw || !emailOk(emailRaw)) {
    return NextResponse.json({ error: "A valid work email is required." }, { status: 400 });
  }

  const limitedEmail = rateLimit(`lead:email:${hashEmail(emailRaw)}`, 6, 3_600_000);
  if (!limitedEmail.ok) {
    return NextResponse.json({ error: "Too many submissions for this email. Try again later." }, { status: 429 });
  }

  const name = clampStr(body.name, 160);
  const company = clampStr(body.company, 160);
  const auditId = typeof body.auditId === "string" && body.auditId.length <= 220 ? body.auditId : undefined;

  if (name && /https?:\/\//i.test(name)) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const payload = {
    email: emailRaw,
    name,
    company,
    auditId,
    receivedAt: new Date().toISOString(),
  };

  console.info("[credex:lead]", JSON.stringify({ ...payload, sourceIp: ip }));

  const webhook = process.env.CREDEX_LEADS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      /* webhook is best-effort */
    }
  }

  return NextResponse.json({ ok: true, message: "Thanks — we'll follow up with Credex next steps." });
}
