# Security and privacy

## Phone numbers

`contact_channels` is the **only** table that stores a real phone number, and it has **no default
select policy at all** — not for `admin`, not for `ambassador`, only `service_role` (which bypasses
RLS) can read it. Every other reference to a reporter is `reporter_ref`, an HMAC-SHA256 of the
phone number (`lib/security/hashing.ts`, keyed by `REPORT_HMAC_SECRET`) — stable enough for
dedup/corroboration, not reversible to the original number.

The only code path that can read a real number back out is `lib/security/reveal-contact.ts`:

1. Confirms the caller is an admin from **their own session** (never a client-supplied flag).
2. Uses the service role to read `contact_channels` (the only role with any policy on it).
3. Writes an `audit_events` row containing a **salted hash** of the revealed number(s)
   (`ADMIN_REVEAL_AUDIT_SALT`), not the number itself — enough to later confirm or deny "was this
   specific number revealed" during an investigation, without the audit log becoming a second copy
   of the contact list.

## Row Level Security

Every table in `supabase/migrations/` has RLS enabled — there is no table left open. The pattern:

- **Residents** never get a direct table grant. All public writes go through `/api/reports` or the
  messaging webhooks, validated with Zod, using the service role server-side.
- **`admin`** (a role recorded in `user_roles`, looked up via `is_admin()`) sees everything except
  `contact_channels`.
- **`ambassador`** is scoped to their own `pilot_area_id` (via `current_ambassador_area()`) on every
  table that has one — reports, evidence, classifications, alerts, escalations.
- **`audit_events`** is insert-only for the service role; `UPDATE`/`DELETE` are explicitly revoked
  from every role at the SQL level (`REVOKE ... FROM service_role`), not just left off a policy —
  defense in depth against the service role's inherent RLS bypass.

RLS policies were exercised against a real local Postgres during development (impersonating anon,
an unrecognized authenticated user, an admin, and an ambassador in turn) — not just read as SQL.
This caught a real bug: the RLS helper functions initially lived in a separate `app` schema, which
PostgREST doesn't expose by default, so every policy referencing them would have silently denied
everyone on a real Supabase project. See `docs/ARCHITECTURE.md`.

A second RLS gap was caught the same way, against the real deployed project: `pilot_metrics` is a
plain view, and a view runs with its *owner's* privileges by default, not the querying user's — so
it bypassed the exact per-ward scoping the base tables (`reports`, `classifications`, `alerts`)
enforce, and returned every ward's operational numbers to any authenticated session, not just
admins. Fixed with `security_invoker` (Postgres 15+), which makes the view re-apply each row's RLS
as the actual caller. `public_alert_feed` is a second view but is deliberately public (sanitized,
no `false_information` rows) and needs no such fix.

## Webhook authenticity

- **WhatsApp**: Meta's `X-Hub-Signature-256` header is verified (`lib/security/hmac.ts`,
  constant-time comparison) against `WHATSAPP_APP_SECRET` before the payload is trusted.
  `lib/config/env.ts` refuses to boot if a live `WHATSAPP_ACCESS_TOKEN` is configured without
  `WHATSAPP_APP_SECRET` — a live token with no signing secret would otherwise accept unverified
  webhook traffic silently.
- **Africa's Talking**: AT has no request-signing mechanism, so the callback URL configured in
  their dashboard carries a shared secret (`?token=AT_INBOUND_SECRET`), compared in constant time.
- **Cron**: `/api/cron/*` requires `Authorization: Bearer CRON_SECRET`.

## Input validation

Every external boundary (webhook payloads, the public report form, server actions) is validated
with Zod before touching the database. Malformed input is rejected, not coerced.

## Secrets

`.env.example` enumerates every variable with no real values. `.env*` is gitignored except
`.env.example`. `lib/config/env.ts` validates the environment at boot with Zod and throws loudly if
a production deployment is missing a required secret — it fails closed, not silently.

## Rate limiting

The public web-intake route (`/api/reports`) is rate-limited by IP (`lib/security/rate-limit.ts`),
backed by a Postgres table (`rate_limit_hits`) so the sliding window is correct across any number of
serverless instances — a plain in-memory map (each instance keeping its own counter) only holds up
for a single-instance deployment, which is why it's no longer the primary path; it remains as the
fallback when there's no real database configured (`DEMO_MODE` / local tests). WhatsApp/SMS intake
don't need this — abuse there is already bounded by the messaging provider's own account limits.

## What's still a human decision

Per the underlying SRS: exact alert wording, evacuation destinations, and emergency contact
information need sign-off from local emergency stakeholders before live use — this codebase
implements the structural minimum-content rules (`lib/core/alert-templates.ts`), not final approved
copy. Retention periods, consent procedures, and who is authorized to publish emergency alerts are
also explicitly out of scope for this build and listed as open questions for the pilot team.
