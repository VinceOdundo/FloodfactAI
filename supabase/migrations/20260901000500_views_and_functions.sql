-- FloodFact AI — 0005: views and RPC helper functions

-- ── Geocoding: map a resolved point to a pilot area polygon ──────────────
create or replace function public.resolve_pilot_area(p_point geography)
returns uuid
language sql
stable
as $$
  select id from public.pilot_areas
  where boundary is not null and ST_Contains(boundary::geometry, p_point::geometry)
  limit 1
$$;

-- ── Corroboration: how many other flood reports in this area recently? ───
create or replace function public.count_recent_corroborations(
  p_pilot_area_id uuid,
  p_since timestamptz,
  p_exclude_report_id uuid
)
returns integer
language sql
stable
as $$
  select count(*)::int from public.reports
  where pilot_area_id = p_pilot_area_id
    and created_at >= p_since
    and id <> p_exclude_report_id
    and hazard_type = 'flood'
$$;

grant execute on function public.resolve_pilot_area(geography) to service_role;
grant execute on function public.count_recent_corroborations(uuid, timestamptz, uuid) to service_role;

-- ── pilot_metrics: computed from real rows, never hand-typed (Acceptance
-- Criterion #10). Each metric is a LATERAL subquery producing exactly one
-- aggregate row per pilot area, so the joins can't fan out into duplicates.
create or replace view public.pilot_metrics as
select
  pa.id as pilot_area_id,
  pa.slug as pilot_area_slug,
  pa.name as pilot_area_name,
  pa.is_active_pilot,
  coalesce(rpt.reports_total, 0) as reports_total,
  coalesce(rpt.false_information_total, 0) as false_information_total,
  rpt.false_information_rate_pct,
  rpt.avg_verification_seconds,
  coalesce(al.alerts_total, 0) as alerts_total,
  al.alerts_within_30min_pct,
  coalesce(amb.ambassadors_active, 0) as ambassadors_active,
  amb.ambassadors_trained_pct,
  coalesce(obs.households_reached_total, 0) as households_reached_total
from public.pilot_areas pa
left join lateral (
  select
    count(*) as reports_total,
    count(*) filter (where c.classification = 'false_information') as false_information_total,
    round(100.0 * count(*) filter (where c.classification = 'false_information') / nullif(count(*), 0), 1) as false_information_rate_pct,
    round(avg(extract(epoch from (c.created_at - r.created_at))), 1) as avg_verification_seconds
  from public.reports r
  join public.classifications c on c.report_id = r.id
  where r.pilot_area_id = pa.id
) rpt on true
left join lateral (
  select
    count(*) as alerts_total,
    round(
      100.0 * count(*) filter (
        where dt.first_delivered_at is not null and dt.first_delivered_at - a.created_at <= interval '30 minutes'
      ) / nullif(count(*), 0), 1
    ) as alerts_within_30min_pct
  from public.alerts a
  left join lateral (
    select min(ad.created_at) as first_delivered_at
    from public.alert_deliveries ad
    where ad.alert_id = a.id and ad.status in ('sent', 'delivered')
  ) dt on true
  where a.pilot_area_id = pa.id
) al on true
left join lateral (
  select
    count(*) filter (where am.active) as ambassadors_active,
    round(
      100.0 * count(*) filter (where am.active and am.training_status = 'trained')
      / nullif(count(*) filter (where am.active), 0), 1
    ) as ambassadors_trained_pct
  from public.ambassadors am
  where am.pilot_area_id = pa.id
) amb on true
left join lateral (
  select sum(ao.measurement) as households_reached_total
  from public.ambassador_observations ao
  where ao.pilot_area_id = pa.id and ao.observation_type = 'household_reached'
) obs on true;

grant select on public.pilot_metrics to authenticated;

-- ── public_alert_feed: sanitized, public-safe view for the resident-facing
-- alerts page. Never includes False Information verdicts (avoid amplifying
-- a debunked rumour by republishing it on a public feed).
create or replace view public.public_alert_feed as
select
  al.id,
  al.message_en,
  al.message_sw,
  pa.name as pilot_area_name,
  c.classification,
  al.created_at
from public.alerts al
join public.classifications c on c.id = al.classification_id
left join public.pilot_areas pa on pa.id = al.pilot_area_id
where c.classification in ('verified_warning', 'elevated_risk')
  and al.status in ('sent', 'partial')
order by al.created_at desc;

grant select on public.public_alert_feed to anon, authenticated;
