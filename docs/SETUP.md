# Setup: from this repo to a live deployment

Nothing in the code needs to change to go from the zero-account demo mode to a fully live system —
only environment variables. Do as many or as few of these sections as you're ready for; each
provider independently falls back to a sandbox mode when its section is skipped (see
`docs/ARCHITECTURE.md`, "Mode switch").

## 1. Supabase (the one required step for a real deployment)

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough for the pilot).
2. In the SQL editor (or via the Supabase CLI — `supabase link` then `supabase db push`), run every
   file in `supabase/migrations/` **in filename order**, then `supabase/seed.sql`.
3. Copy from Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role — keep this secret, server-only)
4. Set `DEMO_MODE=false` (or just remove it).

### Provisioning staff accounts

There is no self-service signup for admin/ambassador accounts — they're provisioned directly:

1. Create the person's login in Supabase Auth (Authentication → Users → Add user, or have them sign
   up via a flow you build later).
2. Insert their role: `insert into user_roles (user_id, role) values ('<their-auth-uid>', 'admin');`
   (or `'ambassador'`).
3. For an ambassador, also create or update their `ambassadors` row with that `user_id` and the
   correct `pilot_area_id` — this is what scopes their RLS access to one ward.

## 2. Security secrets (required for a real deployment)

Generate each with `openssl rand -hex 32`:

- `CRON_SECRET` — protects `/api/cron/*`
- `REPORT_HMAC_SECRET` — hashes phone numbers into `reporter_ref`
- `ADMIN_REVEAL_AUDIT_SALT` — salts the audit trail for phone-number reveals
- `AT_INBOUND_SECRET` — shared secret for the Africa's Talking webhook URL

## 3. WhatsApp — Meta Cloud API (optional, sandbox otherwise)

1. Create an app at [developers.facebook.com](https://developers.facebook.com) → add the "WhatsApp"
   product.
2. The free test number works immediately for up to 5 verified recipient numbers — no business
   verification needed, which is enough to demo live.
3. From the WhatsApp → API Setup page, copy the temporary access token (or generate a permanent
   System User token for production) and the phone number ID into `WHATSAPP_ACCESS_TOKEN` /
   `WHATSAPP_PHONE_NUMBER_ID`.
4. Set `WHATSAPP_VERIFY_TOKEN` to any string you choose.
5. Find `WHATSAPP_APP_SECRET` under App Settings → Basic.
6. Once deployed, configure the webhook URL in the WhatsApp product's Configuration tab:
   `https://<your-domain>/api/webhooks/whatsapp`, verify token = the value you chose above, and
   subscribe to the `messages` field.

## 4. SMS — Africa's Talking (optional, sandbox otherwise)

1. Sign up at [africastalking.com](https://africastalking.com) — the **sandbox** app is instant and
   free, and exercises the same real API calls as production.
2. Copy the API key into `AT_API_KEY`. Leave `AT_USERNAME=sandbox` for testing, or your live
   username once you apply for a shortcode.
3. In the sandbox dashboard, set the SMS callback URL to
   `https://<your-domain>/api/webhooks/africastalking?token=<AT_INBOUND_SECRET>`.

## 5. Anthropic Claude (optional, deterministic-heuristic sandbox otherwise)

1. Get an API key at [console.anthropic.com](https://console.anthropic.com).
2. Set `ANTHROPIC_API_KEY`. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5`.

## 6. Voyage AI embeddings (optional, lexical-fallback otherwise)

1. Get an API key at [dash.voyageai.com](https://dash.voyageai.com).
2. Set `VOYAGE_API_KEY`. `VOYAGE_MODEL` defaults to `voyage-3.5`.
3. Once set, run `npm run seed:backfill-embeddings` to embed the seeded `rumor_patterns` rows (they
   ship with `embedding = null` — never a fabricated vector).

## 7. Esri ArcGIS flood-risk layer (optional, seeded-sandbox otherwise)

1. Find or create a flood-hazard FeatureServer/MapServer layer in ArcGIS Online — a public Living
   Atlas layer, a JRC Global Flood Hazard Map mirror, or your own uploaded risk polygons.
2. Set `ARCGIS_FLOOD_LAYER_URL` to that layer's REST endpoint.
3. If the layer requires authentication, get a free developer key at
   [developers.arcgis.com](https://developers.arcgis.com) and set `ARCGIS_API_KEY`.

## 8. Deploy

1. Push this repo to GitHub (already done if you're reading this from the deployed branch) and
   import it into [Vercel](https://vercel.com/new).
2. Add every environment variable above in the Vercel project settings.
3. Deploy. Vercel builds and serves the Next.js app; Supabase remains the database.
4. Add `APP_URL` and `CRON_SECRET` as **GitHub Actions secrets** on the repo (Settings → Secrets and
   variables → Actions) so `.github/workflows/health-check.yml` can ping the deployed
   `/api/cron/health-check` endpoint every 15 minutes.

## Local development without Docker

This repo's CI and local dev tooling deliberately don't require Docker or the Supabase CLI's local
stack. `scripts/dev/local-supabase-shim.sql` plus a plain local Postgres (with `postgis` and
`pgvector` installed) is enough to validate every migration and RLS policy for real — see
`docs/ARCHITECTURE.md`, "Local verification without Docker or a hosted project." The running app
itself uses `DEMO_MODE=true` fixtures for UI development, so `npm run dev` works immediately with no
database at all.
