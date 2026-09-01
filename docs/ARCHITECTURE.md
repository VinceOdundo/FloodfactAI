# Architecture

## System overview

One Next.js 16 application (App Router, TypeScript strict) is the entire deployable — it serves
the public site, the resident web-intake form, the admin mission-control dashboard, the ambassador
PWA, and every API route (webhooks, cron, intake). Supabase is the entire backend: Postgres (with
PostGIS for geography and pgvector for semantic rumor matching), Auth, Storage, and Realtime.

```
Resident (WhatsApp / SMS / web / ambassador)
        │
        ▼
  Report intake (app/api/webhooks/*, app/api/reports)
        │  creates a `reports` row, responds immediately,
        │  runs the pipeline via Next.js `after()` (non-blocking)
        ▼
  Classification pipeline (lib/pipeline/classify.ts)
   ├─ Understand   → lib/providers/llm-anthropic (structured extraction)
   ├─ Geocode      → lib/core/geocode.ts (gazetteer) + PostGIS resolve_pilot_area()
   ├─ Gather evidence, in parallel:
   │    rainfall        → lib/providers/weather-openmeteo
   │    flood-risk zone  → lib/providers/flood-risk-arcgis
   │    historical rate  → lib/data/historical.ts
   │    corroboration    → count_recent_corroborations() RPC
   │    ambassador truth → lib/data/ambassadors.ts
   │    rumor similarity → lib/data/rumor-patterns.ts (pgvector + lexical fallback)
   ├─ Decide        → lib/core/risk-engine.ts (deterministic, see below)
   ├─ Explain       → lib/providers/llm-anthropic (rationale, EN + SW)
   └─ Alert/Escalate → lib/data/alerts.ts, lib/data/reports.ts (escalations)
        │
        ▼
  WhatsApp / SMS reply, ambassador queue, admin dashboard, public alerts feed
```

Every provider adapter auto-detects live vs. sandbox mode from whether its env vars are set — see
"Mode switch" below. `DEMO_MODE` (or simply an unconfigured Supabase project) additionally lets the
entire UI render from static fixtures with zero external accounts — see "Demo mode" below.

## Why the decision core is not an LLM

This is the one architectural decision worth over-explaining, because it's also the one a judge or
a city procurement officer will probe first: **why isn't this "just call Claude and ask if it's a
real flood"?**

Three requirements from the underlying SRS make that approach actively unsafe:

- **NFR-03**: "the system shall avoid issuing high-confidence warnings solely because a message is
  popular or repeated; decisions should be evidence-based."
- **NFR-05**: "uncertain or conflicting evidence should be surfaced for human review rather than
  represented as certain fact."
- **§13**: "the system should not silently treat missing data as evidence of no risk" and "should
  distinguish between 'no evidence of flooding' and 'evidence that flooding is not occurring.'"

An LLM asked "is this true?" is exactly the failure mode these rules exist to prevent: it can be
swayed by message framing, it doesn't have a principled way to say "I don't have enough evidence to
answer that" instead of confabulating an answer, and it can't be unit-tested against a fixed set of
inputs the way a deterministic function can.

So `lib/core/risk-engine.ts` is a small, pure, dependency-free TypeScript function. It combines
weighted evidence signals (rainfall intensity, flood-risk zone membership, historical base rate,
corroborating reports, ambassador ground truth, rumor-pattern similarity) into one of three
verdicts, with explicit, tested handling for:

1. **Insufficient evidence** (fewer than two usable signals, no direct ambassador check) always
   routes to `elevated_risk` + human escalation — never a confident verdict either way.
2. **Missing data** (`quality: "unavailable"`) is excluded from the score entirely, never averaged
   in as if it meant "no risk."
3. **Corroboration** (repetition) is one signal among several, weighted below direct
   physical/geographic/human evidence — popularity alone cannot manufacture a confident verdict.
4. **Conflicting evidence** (an ambassador's denial contradicted by strong independent evidence) is
   surfaced as its own state and escalated, not silently resolved by picking a side.
5. **"No evidence of flooding" vs. "evidence flooding is not occurring"** are tracked as distinct
   internal booleans; only the latter, and only with real supporting signal, can produce a
   `false_information` verdict.

Every one of these rules has a dedicated test in `tests/unit/risk-engine.test.ts` — 23 cases,
including realistic end-to-end scenarios mirroring the pitch deck's own cited incidents.

Claude is used exactly twice per report, and never to decide:

- **Understanding** (`extractMessage`): structured extraction of hazard type, claimed location,
  atomic claims, language, and urgency from the raw message — via Anthropic tool-use with an
  explicit "extract only what's stated, never infer" system prompt. Logged verbatim to
  `nlu_extractions` for audit.
- **Explaining** (`generateRationale`): given the engine's already-decided verdict and evidence
  list, produce a plain-language, bilingual (English/Swahili) explanation. The prompt explicitly
  instructs the model not to change or hedge the verdict — it explains a decision it did not make.

## Mode switch

There is no manual "sandbox mode" toggle to forget. Each provider checks its own required env vars:

| Provider | Live requires | Sandbox behavior |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` + keys | `DEMO_MODE` fixtures power the whole UI instead |
| WhatsApp | `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | Logs the message, returns "sent" |
| SMS | `AT_API_KEY` | Logs the message, returns "sent" |
| Anthropic | `ANTHROPIC_API_KEY` | Deterministic heuristic extraction/rationale |
| Voyage (embeddings) | `VOYAGE_API_KEY` | Lexical substring match against `rumor_patterns` instead |
| Esri ArcGIS | `ARCGIS_FLOOD_LAYER_URL` | Deterministic seeded synthetic reading |
| Open-Meteo | *(always attempted — free & keyless)* | Only used if the live call itself fails |
| River gauge | *(no live source exists yet)* | Always "unavailable" — see `docs/DATA_SOURCES.md` |

Sandbox evidence is stamped `quality: "degraded"`, not `"ok"` — it's a real, exercised code path,
never presented as a clean live reading. This composes correctly with the risk engine: degrading
every signal uniformly doesn't bias a fully-sandboxed run (a weighted average is unchanged by
scaling every weight by the same factor), so a sandbox demo still reaches realistic verdicts.

## Demo mode

`isDemoMode()` (`lib/config/env.ts`) is true whenever `DEMO_MODE=true` or no Supabase project is
configured. Every UI data-access function in `lib/data/queries/*.ts` checks it and returns static
fixtures (`lib/data/fixtures.ts`) mirroring `supabase/seed.sql`'s story instead of querying
Supabase. `/login` additionally offers a role switcher (writes a cookie) instead of real
authentication. This is how the full click-through demo runs with zero external accounts — see
`docs/SETUP.md` for what changes once a real Supabase project is added (nothing in the code; only
environment variables).

## Data model

Full schema: `supabase/migrations/`. Highlights:

- **`reports`** — the intake record. `reporter_ref` is an HMAC of the phone number (dedup only);
  the actual phone lives only in **`contact_channels`**, which has no default read policy at all —
  see `docs/SECURITY.md`.
- **`evidence_items`** — one row per evidence fetch, the "evidence snapshot" the SRS requires for
  every classification to be reviewable later.
- **`classifications`** — verdict, confidence, `insufficient_evidence` (kept distinct from the
  verdict itself), full evidence snapshot, engine + model versions.
- **`pilot_metrics`** — a **view**, computed from real rows via `LATERAL` joins (never a fan-out
  bug from naively joining multiple one-to-many relations), not a hand-typed number.
- **`audit_events`** — append-only; `UPDATE`/`DELETE` are revoked from every role, including
  `service_role`, at the SQL level, not just "no policy happens to allow it."

All RLS helper functions (`is_admin()`, `is_ambassador()`, `current_ambassador_area()`) live in the
`public` schema, not a separate one — PostgREST (what `@supabase/supabase-js` actually talks to)
only exposes `public` by default, and a separate schema would need every hosted project to remember
a manual dashboard step before any RPC call worked. This was caught and fixed by actually running
the migrations against a local Postgres during development, not just reading the SQL — see
`scripts/dev/`.

## Local verification without Docker or a hosted project

This sandbox has no Docker daemon, so `supabase start` isn't available. Instead:

- `scripts/dev/local-supabase-shim.sql` creates a minimal `auth` schema (users table + `uid()`) and
  the `anon`/`authenticated`/`service_role` Postgres roles, so the **exact** production migrations
  in `supabase/migrations/` run unmodified against a plain local Postgres 16 (with `postgis` and
  `pgvector` installed) for real schema and RLS validation.
- The running app itself uses `DEMO_MODE` fixtures for UI verification (screenshots, Playwright),
  rather than a second parallel database driver — keeping 100% of the real Supabase integration
  code on a single, production-targeted path.

## Sustainability and scale

Every provider has a free tier sufficient for the 500-household Phase-1 pilot: Vercel, Supabase,
Open-Meteo, a Meta WhatsApp test number, and an Africa's Talking sandbox app are all $0 to start;
Anthropic/Voyage costs scale with report volume, which is inherently bounded by pilot size.

The architecture generalizes without rewrites: `hazard_type` and `pilot_area` are data, not code, so
Phase 2 (landslide, fire) is new provider adapters and rows, and Phase 3 (radio, TV, USSD, national
scale) is new delivery channels in `lib/data/alerts.ts` — the pipeline, schema, and risk-engine
contract don't change.

| Scale | Households | Monthly infra | Monthly messaging (approx.) | Monthly LLM (approx.) |
|---|---|---|---|---|
| Phase 1 pilot | 500 | $0 (free tiers) | $0–20 | $0–10 |
| Growth | 5,000 | ~$25 (Vercel/Supabase Pro) | ~$150 | ~$60 |
| Multi-settlement | 50,000 | ~$250 | ~$1,200 | ~$400 |

Messaging and LLM cost scale with report volume, which is driven by actual flood events, not
household count directly — these are conservative upper bounds, not linear projections.
