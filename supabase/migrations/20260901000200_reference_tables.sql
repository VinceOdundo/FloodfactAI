-- FloodFact AI — 0002: reference / slowly-changing tables
-- pilot_areas, ambassadors, historical_flood_events, rumor_patterns, data_source_health

create table if not exists public.pilot_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  ward text,
  county text not null default 'Nairobi',
  -- Approximate operational boundary. See supabase/seed.sql for provenance notes.
  boundary geography(Polygon, 4326),
  centroid geography(Point, 4326),
  population_estimate integer,
  phase smallint not null default 1,           -- 1 = active Phase-1 pilot, 2/3 = future scope
  is_active_pilot boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.pilot_areas is
  'Sub-wards FloodFact operates in or references. Mukuru sub-areas are Phase-1 (is_active_pilot=true); Kibera/Mathare are reference-only areas used for cited historical incidents.';

create table if not exists public.ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  pilot_area_id uuid not null references public.pilot_areas (id),
  phone_hash text not null,                    -- HMAC of phone number; see lib/security/hashing.ts
  training_status text not null default 'not_started'
    check (training_status in ('not_started', 'in_progress', 'trained')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ambassadors_touch_updated_at
  before update on public.ambassadors
  for each row execute function public.touch_updated_at();

create index if not exists ambassadors_pilot_area_idx on public.ambassadors (pilot_area_id);

-- The pilot_area an ambassador is scoped to. Returns null for admins/residents.
-- Defined here (not in 0001) because it queries `ambassadors`, and LANGUAGE sql
-- functions resolve object references at CREATE time, not at call time.
create or replace function public.current_ambassador_area()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pilot_area_id from public.ambassadors where user_id = auth.uid()
$$;

create table if not exists public.historical_flood_events (
  id uuid primary key default gen_random_uuid(),
  pilot_area_id uuid references public.pilot_areas (id),
  location_name text not null,                 -- free-text; not every cited event is inside an active pilot area
  event_date date not null,
  description text not null,
  source text not null,                        -- e.g. "Kenya Red Cross field report, Apr 2024"
  severity text check (severity in ('minor', 'moderate', 'severe', 'catastrophic')),
  deaths integer,
  households_affected integer,
  created_at timestamptz not null default now()
);

create index if not exists historical_flood_events_area_idx on public.historical_flood_events (pilot_area_id);
create index if not exists historical_flood_events_date_idx on public.historical_flood_events (event_date);

create table if not exists public.rumor_patterns (
  id uuid primary key default gen_random_uuid(),
  canonical_claim text not null,
  category text not null default 'other'
    check (category in ('dam_burst', 'death_toll', 'evacuation_order', 'infrastructure_collapse', 'other')),
  embedding vector(1024),                       -- voyage-3.5 dimension; null until backfilled (see scripts/backfill-embeddings.ts)
  source text,
  first_seen_report_id uuid,                    -- FK added in 0003 after reports exists
  occurrence_count integer not null default 1,
  is_confirmed_false boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists rumor_patterns_embedding_idx
  on public.rumor_patterns using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists public.data_source_health (
  id uuid primary key default gen_random_uuid(),
  source text not null unique
    check (source in ('open_meteo', 'arcgis_flood_risk', 'river_level', 'llm_anthropic', 'embeddings_voyage', 'whatsapp', 'sms_africastalking')),
  mode text not null default 'sandbox' check (mode in ('live', 'sandbox')),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  status text not null default 'unknown' check (status in ('ok', 'degraded', 'down', 'unknown')),
  updated_at timestamptz not null default now()
);

create trigger data_source_health_touch_updated_at
  before update on public.data_source_health
  for each row execute function public.touch_updated_at();

insert into public.data_source_health (source) values
  ('open_meteo'), ('arcgis_flood_risk'), ('river_level'),
  ('llm_anthropic'), ('embeddings_voyage'), ('whatsapp'), ('sms_africastalking')
on conflict (source) do nothing;
