# FloodFact AI

Community-centered flood early warning and WhatsApp rumour verification for Nairobi's informal
settlements. Phase 1 pilot: **Mukuru** (kwa Reuben, kwa Njenga, Viwandani).

A resident reports a flood — or a suspicious message — via WhatsApp, SMS, the web, or a trained
youth ambassador. The system cross-checks it against real rainfall, flood-risk, historical, and
ground-truth evidence, reaches a deterministic and fully-tested verdict (**Verified Warning /
Elevated Risk / False Information**), and sends an explainable alert back out — through the
channels residents already trust.

Built for the AI x City Climate Action Hackathon 2026.

## Why this is built the way it is

The one thing that can't be wrong here is the safety decision. So the classification itself
(`lib/core/risk-engine.ts`) is a small, deterministic, exhaustively unit-tested rule set — not an
LLM call. Claude is used elsewhere in the pipeline (structured extraction of the raw message, and
plain-language rationale generation) but never to decide whether a warning is real. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full reasoning and
[`tests/unit/risk-engine.test.ts`](tests/unit/risk-engine.test.ts) for the safety rules as tests.

Every external integration (WhatsApp Cloud API, Africa's Talking SMS, Open-Meteo, Esri ArcGIS,
Anthropic Claude, Voyage AI) is implemented for real against the real API, with a clearly-labeled
sandbox fallback when credentials aren't configured yet — see
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # DEMO_MODE=true works with zero external accounts
npm run dev
```

Visit `http://localhost:3000`. In demo mode, `/login` lets you preview both the admin
mission-control dashboard and the ambassador PWA with no real credentials.

To go live with a real Supabase project (and, optionally, real WhatsApp/SMS/AI credentials), see
[`docs/SETUP.md`](docs/SETUP.md) — nothing in the code needs to change, only environment variables.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js dev/build/start |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next 16 removed `next lint`) |
| `npm test` | Vitest — unit tests for the risk engine, providers, and security helpers |
| `npm run e2e` | Playwright end-to-end smoke tests |
| `npm run db:migrate:local` | Applies `supabase/migrations` + seed data to a local Postgres (no Docker needed) — see `scripts/dev/` |
| `npm run seed:backfill-embeddings` | Backfills `rumor_patterns.embedding` once a Voyage API key is configured |

## Project layout

```
app/                    Next.js App Router — public site, admin, ambassador PWA, API routes
lib/core/               Pure domain logic: the risk engine, alert templates, geocoding gazetteer
lib/providers/          External API adapters (live + sandbox) for every third-party service
lib/data/               Supabase-backed data access + DEMO_MODE fixtures
lib/pipeline/           The report -> evidence -> classification -> alert orchestration
supabase/migrations/    Versioned SQL schema, RLS policies, views — the source of truth for the DB
docs/                   Architecture, setup, security, and data-source documentation
tests/                  Vitest unit tests + Playwright e2e tests
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, the decision pipeline, data model, scaling path
- [`docs/SETUP.md`](docs/SETUP.md) — how to provision every real account and deploy
- [`docs/SECURITY.md`](docs/SECURITY.md) — the security and privacy model
- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — every evidence source, what's real today vs. Phase 2

## Hackathon submission

[`docs/submission/`](docs/submission/) has the three Survey123 deliverables, built from this real
system — no invented numbers or mockups:

- **Concept** ([PDF](docs/submission/FloodFact-AI-Concept.pdf), [PPTX](docs/submission/FloodFact-AI-Concept.pptx)) — the problem, the process flow, and the deterministic-safety-core thesis
- **Demonstration** ([PDF](docs/submission/FloodFact-AI-Demonstration.pdf), [PPTX](docs/submission/FloodFact-AI-Demonstration.pptx)) — real Playwright screenshots walking through the working product end to end
- **Pilot Plan** ([PDF](docs/submission/FloodFact-AI-Pilot-Plan.pdf), [DOCX](docs/submission/FloodFact-AI-Pilot-Plan.docx)) — the 4-week Mukuru pilot, team structure, cost/scale, and full traceability to the Requirements Specification's 12 acceptance criteria

## License

Built for the AI x City Climate Action Hackathon 2026 (Global Covenant of Mayors, Bloomberg
Philanthropies, the European Union, Urban Transitions Mission, Esri, C40 Cities, ICLEI, and
partners).
