"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { AuditInput, AuditResult, ToolAuditResult } from "@/lib/audit-engine";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useMoneyFormatter } from "@/lib/hooks/use-money-formatter";

const STORAGE_KEY_PREFIX = "credex-audit-session:";

interface SessionPayload {
  auditId: string;
  input: AuditInput;
  result: AuditResult;
  narrative: string;
  warnings?: string[];
}

function loadSession(auditId: string): SessionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${auditId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

function recommendationLabel(r: ToolAuditResult["recommendation"]): string {
  switch (r) {
    case "downgrade":
      return "Downgrade / right-size";
    case "switch":
      return "Switch / consolidate";
    case "redundant":
      return "Overlap";
    case "optimal":
      return "Optimal";
    default:
      return r;
  }
}

export function AuditResultsClient({ auditId }: { auditId: string }): ReactElement {
  const { usd } = useMoneyFormatter();
  const [data, setData] = useState<SessionPayload | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultsAnnouncement, setResultsAnnouncement] = useState("");

  useEffect(() => {
    setData(loadSession(auditId));
  }, [auditId]);

  const sortedTools = useMemo(() => {
    if (!data) {
      return [];
    }
    return [...data.result.tools].sort((a, b) => b.monthlySavings - a.monthlySavings);
  }, [data]);

  const submitLead = useCallback(async () => {
    setLeadStatus(null);
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: leadEmail, name: leadName, auditId }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok) {
      setLeadStatus(json.error ?? "Could not submit.");
      return;
    }
    setLeadStatus(json.message ?? "Thanks!");
  }, [auditId, leadEmail, leadName]);

  const createShare = useCallback(async () => {
    if (!data) {
      return;
    }
    setShareStatus(null);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditId: data.auditId,
        input: data.input,
        result: data.result,
        narrative: data.narrative,
      }),
    });
    const json = (await res.json()) as { path?: string; error?: string };
    if (!res.ok || !json.path) {
      setShareStatus(json.error ?? "Could not create share link.");
      return;
    }
    const absolute = `${window.location.origin}${json.path}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setShareStatus(`Copied share link: ${absolute}`);
    } catch {
      setShareStatus(`Share URL: ${absolute}`);
    }
  }, [data]);

  useEffect(() => {
    if (!data) {
      setResultsAnnouncement("");
      return;
    }
    setResultsAnnouncement(
      `Audit results loaded. Modeled monthly savings ${usd(data.result.totalMonthlySavings)}. Review the breakdown and share options below.`,
    );
  }, [data, usd]);

  if (!data) {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-20">
        <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Audit results" }]} />
        <p className="eyebrow">Audit results</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">No session data for this audit</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Open this page from the same browser right after running an audit, or open a share link someone sent you.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Back to audit
        </Link>
      </main>
    );
  }

  const modeledSpend = data.input.tools.reduce((s, t) => s + t.monthlySpend, 0);

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8 sm:pt-18">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {resultsAnnouncement}
      </div>
      <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Audit results" }]} />
      <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/50 to-card px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Audit complete</p>
            <p className="mt-1 text-pretty text-lg font-medium tracking-tight text-foreground">
              You modeled up to {usd(data.result.totalMonthlySavings)} / month back ({usd(data.result.totalAnnualSavings)} / year).
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the breakdown, copy a share link for your team, and drop your email if you want Credex to validate this against invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Audit results</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Modeled savings & recommendations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Team {data.input.teamSize} · {data.input.useCase} · {usd(modeledSpend)}/mo modeled catalog spend
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary">
            Edit inputs
          </Link>
          <button type="button" onClick={() => void createShare()} className="btn-primary">
            Copy share link
          </button>
        </div>
      </div>

      {data.warnings && data.warnings.length > 0 ? (
        <div className="mt-8 rounded-2xl border border-amber-500/35 bg-amber-950/30 px-5 py-4 text-sm text-amber-100/90">
          <p className="font-medium">Notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {data.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div role="region" aria-label="Audit results detail" className="mt-10 space-y-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface-card px-5 py-6">
            <p className="eyebrow">Monthly savings (modeled)</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{usd(data.result.totalMonthlySavings)}</p>
          </div>
          <div className="surface-card px-5 py-6">
            <p className="eyebrow">Annual savings (modeled)</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{usd(data.result.totalAnnualSavings)}</p>
          </div>
          <div className="surface-card px-5 py-6 ring-1 ring-border">
            <p className="eyebrow">Credex portfolio fit</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{data.result.credexOpportunity ? "High — credits & aggregation" : "Emerging — optimize plans first"}</p>
          </div>
        </div>

        <section className="surface-card p-8 sm:p-10">
          <h2 className="section-title">Executive summary</h2>
          <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{data.narrative}</p>
        </section>

        <section className="surface-card overflow-hidden p-0" aria-labelledby="savings-breakdown-heading">
          <div className="border-b border-border px-8 py-6 sm:px-10">
            <h2 id="savings-breakdown-heading" className="section-title">
              Savings breakdown
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Numbers come from catalog pricing, seat math, overlap rules, and tier-fit checks in the Credex audit engine.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Per-tool modeled spend, recommendations, and monthly savings from this audit.</caption>
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    Tool
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    Signal
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    Current
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    Modeled after
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    $/mo
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTools.map((row) => (
                  <tr key={`${row.tool}-${row.currentPlan}`} className="border-t border-border">
                    <th scope="row" className="px-6 py-4 text-left font-medium text-foreground">
                      {row.tool}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{recommendationLabel(row.recommendation)}</td>
                    <td className="px-6 py-4 tabular-nums text-muted-foreground">{usd(row.currentSpend)}</td>
                    <td className="px-6 py-4 tabular-nums text-muted-foreground">{usd(row.estimatedNewSpend)}</td>
                    <td className="px-6 py-4 tabular-nums font-medium text-emerald-700 dark:text-emerald-300">{usd(row.monthlySavings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface-muted p-8 sm:p-10">
          <h2 className="section-title">Advice by line item</h2>
          <div className="mt-6 space-y-4">
            {sortedTools.map((row) => (
              <div key={`${row.tool}-advice`} className="rounded-2xl border border-border bg-card/40 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{row.tool}</p>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{row.priority} priority</span>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{row.recommendedAction}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{row.reasoning}</p>
                {row.recommendedPlan ? (
                  <p className="mt-2 text-xs text-muted-foreground">Suggested plan: {row.recommendedPlan}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10 surface-card p-8 sm:p-10">
        <h2 className="section-title">Credex integration</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {data.result.credexOpportunity
            ? "At your modeled spend, portfolio-level credits and negotiated API rates are usually material. We can map eligible vendors, consolidate invoices, and pressure-test these savings against real usage."
            : "Start by capturing the modeled plan changes above. When monthly AI spend climbs, Credex credits become a lever—re-run the audit as you add seats or API usage."}
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">Work email</p>
            <input
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              type="email"
              className="input-product mt-2"
              placeholder="you@company.com"
              autoComplete="email"
            />
            <p className="mt-4 text-[13px] font-medium text-muted-foreground">Name (optional)</p>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="input-product mt-2"
              placeholder="Jordan Lee"
            />
            <button type="button" onClick={() => void submitLead()} className="btn-primary mt-6 w-full sm:w-auto">
              Talk to Credex
            </button>
            {leadStatus ? <p className="mt-3 text-sm text-muted-foreground">{leadStatus}</p> : null}
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 px-5 py-5 text-sm leading-relaxed text-emerald-100/90">
            <p className="font-semibold text-emerald-50">What happens next</p>
            <p className="mt-3 text-emerald-100/85">
              We use your audit ID to tie this snapshot to a follow-up. No spam — one thread with next steps and an optional working session.
            </p>
          </div>
        </div>
      </section>

      {shareStatus ? (
        <p className="mt-8 text-sm text-muted-foreground" role="status">
          {shareStatus}
        </p>
      ) : null}
    </main>
  );
}
