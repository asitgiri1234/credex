import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { getSharePayload } from "@/lib/share-store";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

type Props = { params: { shareId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = getSharePayload(params.shareId);
  const title = data
    ? `Credex audit · ~$${data.result.totalMonthlySavings}/mo modeled savings`
    : "Credex shared audit";
  const description = data
    ? `${data.narrative.slice(0, 180).replace(/\s+/g, " ").trim()}…`
    : "AI spend audit snapshot — modeled savings, overlap signals, and Credex integration.";
  const ogImage = `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(
    data ? `~$${data.result.totalAnnualSavings.toLocaleString()}/yr modeled` : "Credex",
  )}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteBase()}/r/${params.shareId}`,
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

export default function SharedAuditPage({ params }: Props): ReactElement {
  const data = getSharePayload(params.shareId);

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20">
        <p className="eyebrow">Shared audit</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">This link is not available</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Share links are stored on the server that created them. If the app restarted or you are on another deployment, generate a fresh link from your audit results.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Run a new audit
        </Link>
      </main>
    );
  }

  const top = [...data.result.tools].sort((a, b) => b.monthlySavings - a.monthlySavings).slice(0, 4);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-8 sm:pt-18">
      <p className="eyebrow">Shared Credex audit</p>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        ~${data.result.totalMonthlySavings.toLocaleString()}/mo modeled savings
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Team {data.input.teamSize} · {data.input.useCase} · snapshot {new Date(data.createdAt).toLocaleDateString()}
      </p>

      <section className="mt-10 surface-card p-8 sm:p-10">
        <h2 className="section-title">Summary</h2>
        <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{data.narrative}</p>
      </section>

      <section className="mt-8 surface-muted p-8 sm:p-10">
        <h2 className="section-title">Top levers</h2>
        <ul className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          {top.map((row) => (
            <li key={row.tool} className="rounded-2xl border border-border bg-card/30 px-4 py-3">
              <span className="font-semibold text-foreground">{row.tool}</span> — {row.recommendedAction}{" "}
              <span className="tabular-nums text-emerald-300/90">(~${row.monthlySavings}/mo)</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Run your own audit
        </Link>
        <Link href={`/audit/${data.auditId}`} className="btn-secondary">
          Open full results (same browser session)
        </Link>
      </div>
    </main>
  );
}
