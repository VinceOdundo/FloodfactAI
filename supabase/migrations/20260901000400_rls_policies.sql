-- FloodFact AI — 0004: Row Level Security
--
-- Principles:
--  * RLS is enabled on every table in the public schema. No table is left open.
--  * Operational writes (reports, evidence, classifications, alerts, …) happen
--    only via the service-role key from trusted server code (webhook/route
--    handlers) — there is deliberately no INSERT policy for anon/authenticated
--    on those tables.
--  * `admin` sees everything except contact_channels.
--  * `ambassador` is scoped to their own pilot_area_id.
--  * `contact_channels` (the only table holding a raw phone number) has NO
--    select policy at all — only the service role (which bypasses RLS) can
--    read it, via the explicit "reveal" server action that audits itself.
--  * `audit_events` is insert-only for the service role; nobody can update or
--    delete it (enforced with explicit REVOKEs, not just missing policies).

alter table public.pilot_areas enable row level security;
alter table public.ambassadors enable row level security;
alter table public.historical_flood_events enable row level security;
alter table public.rumor_patterns enable row level security;
alter table public.data_source_health enable row level security;
alter table public.reports enable row level security;
alter table public.contact_channels enable row level security;
alter table public.nlu_extractions enable row level security;
alter table public.evidence_items enable row level security;
alter table public.classifications enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_deliveries enable row level security;
alter table public.ambassador_observations enable row level security;
alter table public.escalations enable row level security;
alter table public.audit_events enable row level security;
alter table public.user_roles enable row level security;

-- ── pilot_areas: public read (ward names/boundaries are not sensitive) ────
create policy pilot_areas_public_read on public.pilot_areas
  for select using (true);

-- ── user_roles: users can see their own role only; admins see all ────────
create policy user_roles_self_read on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

-- ── ambassadors: admin all, ambassador sees own row ───────────────────────
create policy ambassadors_admin_all on public.ambassadors
  for select using (public.is_admin());
create policy ambassadors_self_read on public.ambassadors
  for select using (user_id = auth.uid());

-- ── historical_flood_events, rumor_patterns, data_source_health: staff read
create policy historical_events_staff_read on public.historical_flood_events
  for select using (public.is_admin() or public.is_ambassador());
create policy rumor_patterns_staff_read on public.rumor_patterns
  for select using (public.is_admin() or public.is_ambassador());
create policy data_source_health_staff_read on public.data_source_health
  for select using (public.is_admin() or public.is_ambassador());

-- ── reports: admin all, ambassador scoped to their pilot area ─────────────
create policy reports_admin_all on public.reports
  for select using (public.is_admin());
create policy reports_ambassador_scoped on public.reports
  for select using (public.is_ambassador() and pilot_area_id = public.current_ambassador_area());

-- ── contact_channels: intentionally NO select policy for anyone. ─────────
-- Only the service role (which bypasses RLS) can read this table, via the
-- audited "reveal" server action in lib/security/reveal-contact.ts.

-- ── nlu_extractions: admin-only (internal model-audit artifact) ──────────
create policy nlu_extractions_admin_read on public.nlu_extractions
  for select using (public.is_admin());

-- ── evidence_items: admin all, ambassador scoped via parent report ───────
create policy evidence_items_admin_all on public.evidence_items
  for select using (public.is_admin());
create policy evidence_items_ambassador_scoped on public.evidence_items
  for select using (
    public.is_ambassador() and exists (
      select 1 from public.reports r
      where r.id = evidence_items.report_id
        and r.pilot_area_id = public.current_ambassador_area()
    )
  );

-- ── classifications: same scoping as evidence_items ───────────────────────
create policy classifications_admin_all on public.classifications
  for select using (public.is_admin());
create policy classifications_ambassador_scoped on public.classifications
  for select using (
    public.is_ambassador() and exists (
      select 1 from public.reports r
      where r.id = classifications.report_id
        and r.pilot_area_id = public.current_ambassador_area()
    )
  );

-- ── alerts / alert_deliveries: admin all, ambassador scoped by pilot area ─
create policy alerts_admin_all on public.alerts
  for select using (public.is_admin());
create policy alerts_ambassador_scoped on public.alerts
  for select using (public.is_ambassador() and pilot_area_id = public.current_ambassador_area());

create policy alert_deliveries_admin_all on public.alert_deliveries
  for select using (public.is_admin());
create policy alert_deliveries_ambassador_scoped on public.alert_deliveries
  for select using (
    public.is_ambassador() and exists (
      select 1 from public.alerts a
      where a.id = alert_deliveries.alert_id
        and a.pilot_area_id = public.current_ambassador_area()
    )
  );

-- ── ambassador_observations: ambassadors read/write their own; admin reads all
create policy ambassador_observations_admin_read on public.ambassador_observations
  for select using (public.is_admin());
create policy ambassador_observations_self_read on public.ambassador_observations
  for select using (
    exists (select 1 from public.ambassadors am where am.id = ambassador_observations.ambassador_id and am.user_id = auth.uid())
  );
create policy ambassador_observations_self_insert on public.ambassador_observations
  for insert with check (
    pilot_area_id = public.current_ambassador_area()
    and exists (select 1 from public.ambassadors am where am.id = ambassador_observations.ambassador_id and am.user_id = auth.uid())
  );

-- ── escalations: admin full; ambassador can read+create within their area ─
create policy escalations_admin_all on public.escalations
  for select using (public.is_admin());
create policy escalations_admin_update on public.escalations
  for update using (public.is_admin());
create policy escalations_ambassador_read on public.escalations
  for select using (
    public.is_ambassador() and exists (
      select 1 from public.reports r
      where r.id = escalations.report_id and r.pilot_area_id = public.current_ambassador_area()
    )
  );
create policy escalations_ambassador_create on public.escalations
  for insert with check (
    public.is_ambassador() and exists (
      select 1 from public.reports r
      where r.id = escalations.report_id and r.pilot_area_id = public.current_ambassador_area()
    )
  );

-- ── audit_events: admin can read; nobody (not even table owner grants to
-- authenticated/anon) can write, update, or delete through the API roles.
create policy audit_events_admin_read on public.audit_events
  for select using (public.is_admin());

revoke insert, update, delete on public.audit_events from authenticated, anon;
revoke update, delete on public.audit_events from service_role;
