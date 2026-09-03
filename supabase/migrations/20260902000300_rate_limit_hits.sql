-- FloodFact AI — 0009: Postgres-backed rate limiting
--
-- lib/security/rate-limit.ts previously kept an in-memory sliding window,
-- explicitly flagged (in its own comment and docs/SECURITY.md) as pilot-only
-- since each serverless instance would keep its own independent map. This
-- table backs the same sliding-window check across any number of instances.
-- Only ever touched by trusted server code via the service-role key — no
-- anon/authenticated policy is needed, matching contact_channels/audit_events.

create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_created_idx
  on public.rate_limit_hits (key, created_at);

alter table public.rate_limit_hits enable row level security;
