# Data sources

What's real today, what needs a free account, and what's an honest placeholder for Phase 2.

## Rainfall — Open-Meteo

**Real, free, keyless, always attempted live.** `lib/providers/weather-openmeteo/live.ts` calls
Open-Meteo's public forecast API (`GET /v1/forecast?...&hourly=precipitation&past_hours=3`), which
itself sources ECMWF/national weather-model data including ERA5 reanalysis. No signup, no rate-limit
friction for this volume. Falls back to `quality: "unavailable"` (never a fabricated reading) if the
call itself fails, and to a deterministic sandbox reading only in `DEMO_MODE`.

## Flood-risk geography — Esri ArcGIS

**Real integration, deployment-time layer choice.** `lib/providers/flood-risk-arcgis/live.ts`
queries whatever ArcGIS FeatureServer/MapServer layer is configured via `ARCGIS_FLOOD_LAYER_URL`,
using Esri's standard, stable REST query convention (`{layer}/query?geometry=...&f=json`). This
works with **any** hosted layer — a public ArcGIS Living Atlas flood-hazard layer, a JRC Global
Flood Hazard Map mirrored to ArcGIS Online, or the team's own uploaded risk polygons — which is why
the specific layer is an environment variable, not hardcoded: there is no single universal "the
flood layer" endpoint in real GIS practice. `ARCGIS_API_KEY` is optional and only needed for
secured layers; many Living Atlas layers are queryable anonymously. Esri is a named hackathon
sponsor, so wiring this up for real (rather than mocking it) was a deliberate priority.

## Historical flood records — our own table

**Real, growing.** `historical_flood_events` is seeded with the two incidents actually cited in the
pitch deck (Mathare, April 2024; Kibera, May 2023 — both Kenya Red Cross / iHub Kenya Research) plus
one row explicitly labeled illustrative. This becomes a genuine, compounding data asset as the pilot
runs, not a static demo prop.

## Ambassador ground truth

**Real, and the actual Phase-1 answer to "river level."** Kenya has no open, real-time river-gauge
API suitable for a synchronous per-report check — see "River level" below. Trained youth
ambassadors log water-level readings and visual confirmations directly
(`ambassador_observations`), which is both more honest and more immediately actionable for a
specific settlement than a distant gauge reading would be. The risk engine treats a direct
confirmation as its strongest single signal (see `docs/ARCHITECTURE.md`).

## River level — GloFAS (Phase 2, not yet implemented)

**Honest non-implementation.** `lib/providers/river-level/index.ts` always returns
`quality: "unavailable"` and says so in a code comment, rather than fabricating a plausible-looking
number with nothing behind it. The Copernicus Global Flood Awareness System (GloFAS) publishes
river-discharge forecasts that could cover this, but its access pattern (the `cdsapi`
submit/poll/download-a-NetCDF-file flow) is an async batch job, not a fit for a request-time
evidence check — it would need its own scheduled ingestion pipeline, not a live call from the
classify path. That's a well-scoped Phase 2 addition once the pilot needs multi-settlement river
coverage.

## Rumor pattern matching — Voyage AI embeddings + pgvector

**Real semantic search when configured, honest lexical fallback otherwise.**
`lib/providers/embeddings-voyage` calls Voyage's embeddings API; `rumor_patterns.embedding` is a
pgvector column, matched via cosine similarity through the `match_rumor_pattern` SQL function. When
no Voyage key is configured, `lib/data/rumor-patterns.ts` falls back to token-overlap matching
against the same `canonical_claim` text — lower recall, but never `embedText()` fabricating a
vector, and never silently skipping the check.

## WhatsApp — Meta Cloud API

**Real.** `lib/providers/whatsapp/live.ts` sends via the official Graph API. Meta's free test number
supports up to 5 verified recipients with no business verification — enough to demo live. Inbound
webhook signature verification uses `WHATSAPP_APP_SECRET` (see `docs/SECURITY.md`). The Graph API
version is an env var (`WHATSAPP_API_VERSION`), not hardcoded — Meta deprecates versions on a
schedule, so any fixed default would eventually go stale.

## SMS — Africa's Talking

**Real.** Kenya's standard SMS/USSD gateway, not a generic international provider — matches how
Kenyan products actually ship. AT's own "sandbox" username hits a separate test subdomain with real
API calls to a real test environment.

## Anthropic Claude

**Real, and deliberately scoped.** Used only for structured message understanding and
plain-language rationale generation — never the classification decision itself. See
`docs/ARCHITECTURE.md` for why.

## Pilot-area boundaries

**Illustrative, clearly marked.** `supabase/seed.sql`'s polygons are ~600m bounding boxes around
each settlement's approximate real-world centroid, not surveyed ward boundaries. Before production
use, replace them with real polygons from OpenStreetMap's Nairobi informal-settlements layer or
community-mapped boundaries from Muungano wa Wanavijiji / SDI Kenya.
