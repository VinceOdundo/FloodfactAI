-- LOCAL DEV ONLY.
--
-- Real Supabase projects provide the `auth` schema (auth.users, auth.uid(),
-- storage, realtime, …) natively. This file exists purely so the exact SQL
-- in supabase/migrations/ can be validated against a plain local Postgres
-- in this sandbox, with zero external accounts.
--
-- Never run this against a real Supabase project — its `auth` schema already
-- exists and this would conflict with it.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Mirrors Supabase's auth.uid(): reads the JWT "sub" claim. Locally there is
-- no PostgREST/GoTrue to set that claim, so tests set it explicitly with
-- `select set_config('request.jwt.claim.sub', '<uuid>', true);`.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Supabase provisions these three Postgres roles on every project. Create
-- them locally so GRANT/REVOKE statements in the migrations run unmodified.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon noLogin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated noLogin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role noLogin bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
-- Tables created by later migrations also need the grant, since this shim
-- runs once, before the migrations, in the local validation pipeline.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
