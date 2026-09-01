-- FloodFact AI — 0001: extensions, role model, helper functions
-- Requires a Supabase project (auth.users is provided by Supabase Auth).
-- For local-Postgres-only development, run scripts/dev/local-supabase-shim.sql first.

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists postgis;       -- geography columns for pilot areas / report locations
create extension if not exists vector;        -- pgvector for rumor-pattern semantic similarity

-- ─────────────────────────────────────────────────────────────────────────
-- Role model
--
-- We deliberately do NOT rely on custom JWT claims (would need a Supabase
-- Auth hook to populate). Instead, role is looked up server-side from a
-- plain table keyed by auth.uid(), which is the simplest pattern that is
-- still safe under RLS (the lookup function is STABLE + SECURITY DEFINER
-- so it can read user_roles even though user_roles itself is locked down).
--
-- All helper functions live in `public`, not a separate schema: PostgREST
-- (what Supabase's JS client actually talks to) only exposes the `public`
-- schema by default. A separate schema would need every hosted project to
-- remember a manual "expose this schema" dashboard step before any RPC call
-- would work — a footgun with no real upside here.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'ambassador')),
  created_at timestamptz not null default now()
);

comment on table public.user_roles is
  'One row per authenticated staff user (admin or ambassador). Residents are anonymous and never appear here.';

-- Named app_role(), not current_role(): the latter collides with the SQL
-- standard CURRENT_ROLE construct and is best left alone.
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.app_role() = 'admin', false)
$$;

create or replace function public.is_ambassador()
returns boolean
language sql
stable
as $$
  select coalesce(public.app_role() = 'ambassador', false)
$$;

-- Note: public.current_ambassador_area() is defined in
-- 0002_reference_tables.sql, right after the `ambassadors` table it queries
-- exists — Postgres validates object references in LANGUAGE sql functions
-- at CREATE time, not lazily.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
