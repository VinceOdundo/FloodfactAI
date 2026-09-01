-- FloodFact AI — 0003: the report -> evidence -> classification -> alert pipeline

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  source_channel text not null check (source_channel in ('whatsapp', 'sms', 'web', 'ambassador')),
  raw_text text not null,
  media_urls text[] not null default '{}',
  reporter_ref text not null,                   -- HMAC(phone), for dedup/corroboration only — never the phone itself
  claimed_location_text text,
  geocoded_point geography(Point, 4326),
  pilot_area_id uuid references public.pilot_areas (id),
  hazard_type text not null default 'flood' check (hazard_type in ('flood', 'rumor', 'other')),
  language text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'classified', 'escalated', 'resolved', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();

create index if not exists reports_pilot_area_idx on public.reports (pilot_area_id);
create index if not exists reports_reporter_ref_idx on public.reports (reporter_ref);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_geocoded_point_idx on public.reports using gist (geocoded_point);

alter table public.rumor_patterns
  add constraint rumor_patterns_first_seen_report_fk
  foreign key (first_seen_report_id) references public.reports (id) on delete set null;

-- The ONLY table allowed to hold a raw phone number. No default RLS select
-- policy is granted to anyone in 0004 — access requires the explicit
-- "reveal" server action in lib/security, which writes an audit_events row.
create table if not exists public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'sms')),
  phone_e164 text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_channels_report_idx on public.contact_channels (report_id);

create table if not exists public.nlu_extractions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  provider_mode text not null check (provider_mode in ('live', 'sandbox')),
  model text not null,
  extracted_json jsonb not null,
  key_claims text[] not null default '{}',
  hazard_type_guess text,
  claimed_location_text text,
  language text,
  urgency_signal text check (urgency_signal in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists nlu_extractions_report_idx on public.nlu_extractions (report_id);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  source text not null check (source in (
    'open_meteo', 'arcgis_flood_risk', 'river_level', 'historical_base_rate',
    'corroboration', 'ambassador_ground_truth', 'rumor_pattern_similarity'
  )),
  observation jsonb not null,
  numeric_value numeric,
  unit text,
  quality text not null check (quality in ('ok', 'degraded', 'unavailable')),
  observed_at timestamptz,
  fetched_at timestamptz not null default now(),
  raw_response jsonb
);

create index if not exists evidence_items_report_idx on public.evidence_items (report_id);
create index if not exists evidence_items_source_idx on public.evidence_items (source);

create table if not exists public.classifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  classification text not null
    check (classification in ('verified_warning', 'elevated_risk', 'false_information')),
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  insufficient_evidence boolean not null default false,
  rationale_en text not null,
  rationale_sw text,
  evidence_snapshot jsonb not null,
  engine_version text not null,
  llm_model text,
  llm_provider_mode text check (llm_provider_mode in ('live', 'sandbox')),
  created_at timestamptz not null default now()
);

create index if not exists classifications_report_idx on public.classifications (report_id);
create index if not exists classifications_created_at_idx on public.classifications (created_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  classification_id uuid not null references public.classifications (id) on delete cascade,
  pilot_area_id uuid references public.pilot_areas (id),
  message_en text not null,
  message_sw text,
  channels text[] not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'partial')),
  created_at timestamptz not null default now()
);

create index if not exists alerts_classification_idx on public.alerts (classification_id);
create index if not exists alerts_pilot_area_idx on public.alerts (pilot_area_id);

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'sms', 'notice_board', 'ambassador_queue')),
  recipient_ref text,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger alert_deliveries_touch_updated_at
  before update on public.alert_deliveries
  for each row execute function public.touch_updated_at();

create index if not exists alert_deliveries_alert_idx on public.alert_deliveries (alert_id);

create table if not exists public.ambassador_observations (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.ambassadors (id),
  report_id uuid references public.reports (id) on delete set null,
  pilot_area_id uuid not null references public.pilot_areas (id),
  observation_type text not null
    check (observation_type in ('water_level', 'visual_confirmation', 'household_reached', 'other')),
  -- Meaning depends on observation_type: centimeters for water_level,
  -- household count for household_reached, null/unused otherwise.
  measurement numeric,
  -- Only meaningful for observation_type='visual_confirmation': true = the
  -- ambassador confirmed flooding, false = checked and found none. This is
  -- a real tri-state (see AmbassadorGroundTruthEvidence) — null is not "no
  -- flooding", it means "not a visual-confirmation observation at all".
  confirmed boolean,
  notes text,
  photo_url text,
  recorded_at timestamptz not null default now()
);

create index if not exists ambassador_observations_area_idx on public.ambassador_observations (pilot_area_id);
create index if not exists ambassador_observations_report_idx on public.ambassador_observations (report_id);

create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  classification_id uuid references public.classifications (id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  assigned_to uuid references auth.users (id),
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists escalations_status_idx on public.escalations (status);
create index if not exists escalations_report_idx on public.escalations (report_id);

-- Append-only. No update/delete grants are issued to any non-service role in 0004.
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('system', 'user')),
  actor_id text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_entity_idx on public.audit_events (entity_type, entity_id);
create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
