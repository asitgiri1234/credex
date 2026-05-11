# Credex — AI spend audit

**Credex** is a web app for **finance-minded founders and ops leads** who need to justify AI subscription spend: map vendors and plans, run a deterministic “tier fit + overlap + cheaper plan” audit against **vendor list-price snapshots**, and get a shareable summary with **official pricing citations**. It is not a live billing integration—it is a **defensible modeling layer** your team can sanity-check before buying or renewing.

**Live:** [https://credex-xi-rust.vercel.app/](https://credex-xi-rust.vercel.app/)  
**Walkthrough (~30s+):** [Loom — product tour](https://www.loom.com/share/fd4009496df64953bcdf8def4c7bd349)

> Screenshots: add 3+ to `/docs/screenshots/` when you have them, or rely on the Loom above for reviewers who want motion.

## Quick start

### Install

```bash
git clone https://github.com/asitgiri1234/credex.git
cd credex
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional: set `OPENAI_API_KEY` for LLM-generated audit narratives (otherwise a deterministic template runs).

```bash
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run test      # Vitest (audit engine)
npm run build     # Production build
```

### Deploy (Vercel)

1. Import the repo in [Vercel](https://vercel.com).
2. Set **`NEXT_PUBLIC_SITE_URL`** to your production URL (used for OG metadata and absolute links).
3. Optional: `OPENAI_API_KEY`, `OPENAI_SUMMARY_MODEL`, `CREDEX_LEADS_WEBHOOK_URL` for leads webhook.
4. Deploy — framework preset **Next.js**, build `npm run build`, output default.

## Decisions (trade-offs)

1. **In-memory audit + share sessions vs database** — Fast to ship and zero infra cost; **lost on cold start** and not multi-instance safe. Chosen for MVP velocity; production would use Redis/Postgres with TTL.
2. **Static pricing snapshots vs live APIs** — Vendors do not expose stable public APIs for “your invoice”; we **snapshot list prices** with URLs and verification dates. Trade-off: stale numbers until someone updates `lib/pricing-data.ts`; gain is auditability for reviewers.
3. **Server-side audit recompute from catalog** — The client sends tool/plan/seats; the API **recomputes** spend from the catalog so tampered `monthlySpend` cannot drive the engine. Trade-off: client and server must stay in sync with catalog shape.
4. **Template narrative + optional OpenAI** — Without an API key, audits still ship a **~100-word** summary from rules. Trade-off: less “voice”; gain is no vendor lock-in for demos and CI.
5. **Next.js App Router + API routes only** — No separate BFF service. Trade-off: long-running jobs or heavy queues do not fit; gain is one deployable unit and simple mental model for a small team.

## Documentation map

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System diagram, data flow, stack, scaling notes |
| [DEVLOG.md](./DEVLOG.md) | Daily work log (7 days) |
| [REFLECTION.md](./REFLECTION.md) | Retrospective prompts |
| [TESTS.md](./TESTS.md) | Automated tests inventory |
| [PRICING_DATA.md](./PRICING_DATA.md) | Pricing sources traceability |
| [PROMPTS.md](./PROMPTS.md) | LLM prompts for summaries |
| [GTM.md](./GTM.md) | Go-to-market notes |
| [ECONOMICS.md](./ECONOMICS.md) | Unit economics sketch |
| [LANDING_COPY.md](./LANDING_COPY.md) | Marketing-ready copy |
| [METRICS.md](./METRICS.md) | North-star and instrumentation |

## License

Private / program use unless otherwise stated by the Credex team.
