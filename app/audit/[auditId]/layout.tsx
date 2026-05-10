import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAuditSession } from "@/lib/audit-session-store";
import { redactEmails } from "@/lib/share-sanitize";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: { auditId: string } }): Promise<Metadata> {
  const data = getAuditSession(params.auditId);
  const title = data
    ? `~$${data.result.totalMonthlySavings.toLocaleString()}/mo modeled savings · Credex audit`
    : "Audit results · Credex";
  const narrativeSafe = data ? redactEmails(data.narrative) : "";
  const description = data
    ? `${narrativeSafe.slice(0, 180).replace(/\s+/g, " ").trim()}…`
    : "Modeled AI subscription savings, overlap signals, and official pricing citations from Credex.";
  const ogImage = `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
    data ? `Team ${data.input.teamSize} · ${data.input.useCase}` : "Credex",
  )}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteBase()}/audit/${params.auditId}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function AuditDynamicLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
