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

function normalizeSessionPayload(raw: SessionPayload): SessionPayload {
  return {
    ...raw,
    result: {
      ...raw.result,
      tools: raw.result.tools.map((t) => ({
        ...t,
        pricingCitations: Array.isArray(t.pricingCitations) ? t.pricingCitations : [],
      })),
    },
  };
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
    return normalizeSessionPayload(JSON.parse(raw) as SessionPayload);
  } catch {
    return null;
  }
}

function persistSession(payload: SessionPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${payload.auditId}`, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
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
  const [hydrating, setHydrating] = useState(true);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadHoneypot, setLeadHoneypot] = useState("");
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultsAnnouncement, setResultsAnnouncement] = useState("");

  useEffect(() => {
    const local = loadSession(auditId);
    if (local) {
      setData(local);
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    void (async () => {
      try {
        const res = await fetch(`/api/audit/${encodeURIComponent(auditId)}`);
        if (!res.ok) {
          if (!cancelled) {
            setData(null);
          }
          return;
        }
        const json = (await res.json()) as {
          auditId?: string;
          input?: AuditInput;
          result?: AuditResult;
          narrative?: string;
          warnings?: string[];
        };
        if (cancelled || !json.auditId || !json.input || !json.result || typeof json.narrative !== "string") {
          if (!cancelled) {
            setData(null);
          }
          return;
        }
        const payload = normalizeSessionPayload({
          auditId: json.auditId,
          input: json.input,
          result: json.result,
          narrative: json.narrative,
          warnings: json.warnings,
        });
        persistSession(payload);
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
      body: JSON.stringify({ email: leadEmail, name: leadName, auditId, website: leadHoneypot }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok) {
      setLeadStatus(json.error ?? "Could not submit.");
      return;
    }
    setLeadStatus(json.message ?? "Thanks!");
  }, [auditId, leadEmail, leadHoneypot, leadName]);

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

  if (hydrating) {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-20">
        <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Audit results" }]} />
        <p className="eyebrow">Audit results</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Loading audit…</h1>
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Retrieving results from this browser or the Credex server.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-20">
        <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Audit results" }]} />
        <p className="eyebrow">Audit results</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">No session data for this audit</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          This link may be from another device, the server may have restarted, or the audit expired. Run a new audit on this device, or open a{" "}
          <strong className="text-foreground">share link</strong> (<span className="text-foreground">/r/…</span>) from the results page.
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

        <section className="surface-card p-8 sm:p-10" aria-labelledby="exec-summary-heading">
          <h2 id="exec-summary-heading" className="section-title">
            Executive summary
          </h2>
          <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{data.narrative}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Figures use catalog list-price snapshots with{" "}
            <Link href="/compare-ai-plans#pricing-sources" className="underline underline-offset-4">
              cited vendor pages
            </Link>
            ; validate before presenting to finance.
          </p>
        </section>

        <section className="surface-card overflow-hidden p-0" aria-labelledby="savings-breakdown-heading">
          <div className="border-b border-border px-8 py-6 sm:px-10">
            <h2 id="savings-breakdown-heading" className="section-title">
              Savings breakdown
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              List-price assumptions are cited per vendor below. Savings combine seat math, overlap rules, and tier-fit checks in the Credex audit engine.
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
                  <th scope="col" className="px-6 py-3 font-semibold text-foreground">
                    Pricing sources
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
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {row.pricingCitations.length === 0 ? (
                        <span>—</span>
                      ) : (
                        <ul className="list-inside list-disc space-y-1">
                          {row.pricingCitations.map((c) => (
                            <li key={c.url}>
                              <a href={c.url} className="text-foreground underline underline-offset-2" target="_blank" rel="noreferrer">
                                {c.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
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
                {row.pricingCitations.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {row.pricingCitations.map((c) => (
                      <li key={c.url}>
                        <a href={c.url} className="text-foreground underline underline-offset-2" target="_blank" rel="noreferrer">
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
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
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitLead();
            }}
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={leadHoneypot}
              onChange={(e) => setLeadHoneypot(e.target.value)}
              className="pointer-events-none absolute left-[-10000px] h-px w-px opacity-0"
            />
            <div>
              <label htmlFor="lead-email" className="text-[13px] font-medium text-muted-foreground">
                Work email
              </label>
              <input
                id="lead-email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                type="email"
                className="input-product mt-2"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="lead-name" className="text-[13px] font-medium text-muted-foreground">
                Name (optional)
              </label>
              <input
                id="lead-name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="input-product mt-2"
                placeholder="Jordan Lee"
                autoComplete="name"
              />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Talk to Credex
            </button>
            {leadStatus ? (
              <p className="text-sm text-muted-foreground" role="status">
                {leadStatus}
              </p>
            ) : null}
          </form>
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
