-- FloodFact AI — seed data
--
-- Real, cited facts where the source materials give them (pilot areas'
-- approximate real-world location, the two Kenya Red Cross / iHub incidents,
-- the one cited WhatsApp rumour pattern). Everything else (demo reports,
-- classifications, alerts, ambassador rosters) is clearly synthetic seed
-- data for local development and screenshots — never presented as live
-- measurements. Deterministic UUIDs are used throughout so this file is
-- readable and idempotent (safe to re-run via `on conflict do nothing`).

-- ─────────────────────────────────────────────────────────────────────────
-- Pilot areas
--
-- Boundaries are illustrative ~600m squares around each settlement's
-- approximate real-world centroid — NOT surveyed ward boundaries. Before
-- production use, replace `boundary` with real polygons from OpenStreetMap's
-- Nairobi informal-settlements layer or community-mapped boundaries from
-- Muungano wa Wanavijiji / SDI Kenya, per docs/DATA_SOURCES.md.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.pilot_areas (id, slug, name, ward, county, boundary, centroid, population_estimate, phase, is_active_pilot)
values
  ('10000000-0000-0000-0000-000000000001', 'mukuru-kwa-reuben', 'Mukuru kwa Reuben', 'Viwandani', 'Nairobi',
   ST_GeogFromText('POLYGON((36.8636 -1.3056, 36.8716 -1.3056, 36.8716 -1.3116, 36.8636 -1.3116, 36.8636 -1.3056))'),
   ST_GeogFromText('POINT(36.8676 -1.3086)'), 65000, 1, true),
  ('10000000-0000-0000-0000-000000000002', 'mukuru-kwa-njenga', 'Mukuru kwa Njenga', 'Viwandani', 'Nairobi',
   ST_GeogFromText('POLYGON((36.8750 -1.3109, 36.8830 -1.3109, 36.8830 -1.3169, 36.8750 -1.3169, 36.8750 -1.3109))'),
   ST_GeogFromText('POINT(36.8790 -1.3139)'), 90000, 1, true),
  ('10000000-0000-0000-0000-000000000003', 'viwandani', 'Viwandani', 'Viwandani', 'Nairobi',
   ST_GeogFromText('POLYGON((36.8540 -1.2990, 36.8620 -1.2990, 36.8620 -1.3050, 36.8540 -1.3050, 36.8540 -1.2990))'),
   ST_GeogFromText('POINT(36.8580 -1.3020)'), 40000, 1, true),
  ('10000000-0000-0000-0000-000000000004', 'kibera', 'Kibera', 'Kibera', 'Nairobi',
   ST_GeogFromText('POLYGON((36.7780 -1.3103, 36.7860 -1.3103, 36.7860 -1.3163, 36.7780 -1.3163, 36.7780 -1.3103))'),
   ST_GeogFromText('POINT(36.7820 -1.3133)'), 185000, 1, false),
  ('10000000-0000-0000-0000-000000000005', 'mathare', 'Mathare', 'Mathare', 'Nairobi',
   ST_GeogFromText('POLYGON((36.8530 -1.2556, 36.8610 -1.2556, 36.8610 -1.2616, 36.8530 -1.2616, 36.8530 -1.2556))'),
   ST_GeogFromText('POINT(36.8570 -1.2586)'), 87000, 1, false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Historical flood events — the two incidents cited in the pitch deck are
-- real; the third is explicitly marked illustrative.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.historical_flood_events (id, pilot_area_id, location_name, event_date, description, source, severity, deaths, households_affected)
values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Mathare',
   '2024-04-15', 'Flash flood struck Mathare at approximately 2 AM with no official alert issued; residents woke to waist-high water. A viral WhatsApp voice note falsely claiming a nearby dam had burst caused families to flee into unaffected, more dangerous streets; two people were injured in the panic.',
   'Kenya Red Cross field report, Apr 2024', 'severe', 0, null),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Kibera',
   '2023-05-01', 'Long rains caused severe flooding across Kibera. KMD had issued a regional advisory but it never reached households; the average delay before any alert reached residents was 72 hours. So many false WhatsApp warnings had circulated earlier that many residents dismissed the eventual official SMS alerts as rumours, and thousands delayed evacuation.',
   'Kenya Red Cross 2023; iHub Kenya Research', 'severe', null, null),
  ('70000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Mukuru kwa Reuben',
   '2022-11-20', 'ILLUSTRATIVE EXAMPLE (not independently sourced): moderate flooding along the Ngong River affecting low-lying structures. Included to demonstrate the historical-base-rate evidence source until real Mukuru-specific incident records are collected during the Phase-1 pilot.',
   'Illustrative — replace with verified pilot-collected records', 'moderate', 0, 40)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Rumor patterns — MTH-2024-DAM is the real cited pattern; the rest are
-- illustrative archetypes seeded so similarity search has something to
-- match against before the pilot has produced its own classified history.
-- Embeddings are left null and backfilled by scripts/backfill-embeddings.ts
-- (requires a Voyage API key; sandbox mode skips similarity scoring instead
-- of fabricating a vector).
-- ─────────────────────────────────────────────────────────────────────────
insert into public.rumor_patterns (id, canonical_claim, category, source, occurrence_count, is_confirmed_false)
values
  ('60000000-0000-0000-0000-000000000001', 'A nearby dam has burst and floodwater is rushing toward the settlement', 'dam_burst',
   'Kenya Red Cross field report, Apr 2024 (Mathare)', 1, true),
  ('60000000-0000-0000-0000-000000000002', 'The government is hiding the true number of flood deaths in the area', 'death_toll',
   'Illustrative archetype', 1, true),
  ('60000000-0000-0000-0000-000000000003', 'Authorities have ordered immediate evacuation of the entire settlement tonight', 'evacuation_order',
   'Illustrative archetype', 1, true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Ambassadors — synthetic roster, not yet linked to auth.users (user_id is
-- populated when each ambassador's Supabase Auth account is provisioned).
-- ─────────────────────────────────────────────────────────────────────────
insert into public.ambassadors (id, full_name, pilot_area_id, phone_hash, training_status, active)
values
  ('20000000-0000-0000-0000-000000000001', 'Faith Wanjiru', '10000000-0000-0000-0000-000000000001', 'seed-hash-1', 'trained', true),
  ('20000000-0000-0000-0000-000000000002', 'Brian Otieno', '10000000-0000-0000-0000-000000000001', 'seed-hash-2', 'trained', true),
  ('20000000-0000-0000-0000-000000000003', 'Grace Achieng', '10000000-0000-0000-0000-000000000002', 'seed-hash-3', 'trained', true),
  ('20000000-0000-0000-0000-000000000004', 'Kevin Mwangi', '10000000-0000-0000-0000-000000000002', 'seed-hash-4', 'in_progress', true),
  ('20000000-0000-0000-0000-000000000005', 'Purity Nekesa', '10000000-0000-0000-0000-000000000003', 'seed-hash-5', 'trained', true),
  ('20000000-0000-0000-0000-000000000006', 'Dennis Kiptoo', '10000000-0000-0000-0000-000000000003', 'seed-hash-6', 'not_started', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- Demo pipeline trail — synthetic reports carried through the full
-- report -> evidence -> classification -> alert flow, for local screenshots
-- and dashboard rendering. Timestamps are relative to now() so the "recent
-- activity" views always look live.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.reports (id, source_channel, raw_text, reporter_ref, claimed_location_text, geocoded_point, pilot_area_id, hazard_type, language, status, created_at)
values
  ('30000000-0000-0000-0000-000000000001', 'whatsapp',
   'Water is rising fast near the railway crossing in kwa Reuben, already at knee height on Kanini Road',
   'seed-reporter-hash-1', 'Kanini Road, Mukuru kwa Reuben', ST_GeogFromText('POINT(36.8681 -1.3081)'),
   '10000000-0000-0000-0000-000000000001', 'flood', 'en', 'classified', now() - interval '3 hours'),
  ('30000000-0000-0000-0000-000000000002', 'whatsapp',
   'Nimesikia wanasema dam imepasuka karibu na Njenga, watu wanakimbia!',
   'seed-reporter-hash-2', 'Mukuru kwa Njenga', ST_GeogFromText('POINT(36.8788 -1.3141)'),
   '10000000-0000-0000-0000-000000000002', 'rumor', 'sw', 'classified', now() - interval '90 minutes'),
  ('30000000-0000-0000-0000-000000000003', 'sms',
   'Heavy rain since morning, drainage along Mombasa road blocked, water entering some structures in Viwandani',
   'seed-reporter-hash-3', 'Viwandani, near Likoni Road', ST_GeogFromText('POINT(36.8577 -1.3018)'),
   '10000000-0000-0000-0000-000000000003', 'flood', 'en', 'classified', now() - interval '45 minutes'),
  ('30000000-0000-0000-0000-000000000004', 'ambassador',
   'Resident reports drizzle only, no flooding observed, but worried about forwarded voice note',
   'seed-reporter-hash-4', 'Mukuru kwa Reuben', ST_GeogFromText('POINT(36.8670 -1.3090)'),
   '10000000-0000-0000-0000-000000000001', 'rumor', 'en', 'escalated', now() - interval '20 minutes'),
  ('30000000-0000-0000-0000-000000000005', 'web',
   'Just checking, is it safe to walk through Viwandani tonight given the rain?',
   'seed-reporter-hash-5', 'Viwandani', null,
   '10000000-0000-0000-0000-000000000003', 'other', 'en', 'pending', now() - interval '5 minutes')
on conflict (id) do nothing;

insert into public.nlu_extractions (report_id, provider_mode, model, extracted_json, key_claims, hazard_type_guess, claimed_location_text, language, urgency_signal)
values
  ('30000000-0000-0000-0000-000000000001', 'sandbox', 'sandbox-extractor-v1',
   '{"note":"deterministic sandbox extraction, no external LLM call"}'::jsonb,
   array['Water rising near railway crossing', 'Knee-height on Kanini Road'], 'flood', 'Kanini Road, Mukuru kwa Reuben', 'en', 'high'),
  ('30000000-0000-0000-0000-000000000002', 'sandbox', 'sandbox-extractor-v1',
   '{"note":"deterministic sandbox extraction, no external LLM call"}'::jsonb,
   array['Claim: a dam has burst near Njenga', 'People reportedly fleeing'], 'rumor', 'Mukuru kwa Njenga', 'sw', 'high'),
  ('30000000-0000-0000-0000-000000000003', 'sandbox', 'sandbox-extractor-v1',
   '{"note":"deterministic sandbox extraction, no external LLM call"}'::jsonb,
   array['Blocked drainage on Mombasa Road', 'Water entering structures'], 'flood', 'Viwandani, near Likoni Road', 'en', 'medium'),
  ('30000000-0000-0000-0000-000000000004', 'sandbox', 'sandbox-extractor-v1',
   '{"note":"deterministic sandbox extraction, no external LLM call"}'::jsonb,
   array['No flooding observed directly', 'Concern about a forwarded voice note'], 'rumor', 'Mukuru kwa Reuben', 'en', 'medium')
on conflict do nothing;

insert into public.evidence_items (report_id, source, observation, numeric_value, unit, quality, observed_at)
values
  ('30000000-0000-0000-0000-000000000001', 'open_meteo', '{"note":"sandbox synthetic reading"}'::jsonb, 38.5, 'mm/3h', 'ok', now() - interval '3 hours'),
  ('30000000-0000-0000-0000-000000000001', 'arcgis_flood_risk', '{"note":"point falls inside a mapped high-risk buffer"}'::jsonb, 1, 'risk_zone_flag', 'ok', now() - interval '3 hours'),
  ('30000000-0000-0000-0000-000000000001', 'historical_base_rate', '{"note":"prior flood events recorded nearby"}'::jsonb, 0.6, 'base_rate', 'ok', now() - interval '3 hours'),
  ('30000000-0000-0000-0000-000000000001', 'corroboration', '{"note":"other reports in same area within 60 minutes"}'::jsonb, 2, 'count', 'ok', now() - interval '3 hours'),
  ('30000000-0000-0000-0000-000000000002', 'rumor_pattern_similarity', '{"matched_pattern_id":"60000000-0000-0000-0000-000000000001"}'::jsonb, 0.91, 'cosine_similarity', 'ok', now() - interval '90 minutes'),
  ('30000000-0000-0000-0000-000000000002', 'open_meteo', '{"note":"sandbox synthetic reading"}'::jsonb, 2.1, 'mm/3h', 'ok', now() - interval '90 minutes'),
  ('30000000-0000-0000-0000-000000000002', 'arcgis_flood_risk', '{"note":"point falls outside mapped high-risk buffer"}'::jsonb, 0, 'risk_zone_flag', 'ok', now() - interval '90 minutes'),
  ('30000000-0000-0000-0000-000000000003', 'open_meteo', '{"note":"sandbox synthetic reading"}'::jsonb, 22.0, 'mm/3h', 'ok', now() - interval '45 minutes'),
  ('30000000-0000-0000-0000-000000000003', 'arcgis_flood_risk', '{"note":"point falls inside a mapped moderate-risk buffer"}'::jsonb, 0.5, 'risk_zone_flag', 'degraded', now() - interval '45 minutes'),
  ('30000000-0000-0000-0000-000000000004', 'river_level', '{"note":"no ambassador ground-truth logged yet"}'::jsonb, null, null, 'unavailable', now() - interval '20 minutes')
on conflict do nothing;

insert into public.classifications (id, report_id, classification, confidence, insufficient_evidence, rationale_en, rationale_sw, evidence_snapshot, engine_version, llm_model, llm_provider_mode, created_at)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'verified_warning', 0.88, false,
   'Heavy rainfall in the last 3 hours, the location sits inside a mapped high flood-risk zone, similar events have happened here before, and 2 other nearby reports corroborate rising water.',
   'Mvua nyingi kwa masaa 3 yaliyopita, eneo liko ndani ya ukanda wa hatari ya mafuriko, matukio kama haya yametokea hapo awali, na ripoti nyingine 2 za karibu zinathibitisha kupanda kwa maji.',
   '{"rainfall_mm_3h":38.5,"risk_zone":true,"historical_base_rate":0.6,"corroborating_reports":2}'::jsonb,
   'risk-engine-1.0.0', 'sandbox-rationale-v1', 'sandbox', now() - interval '2 hours 58 minutes'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'false_information', 0.82, false,
   'This message closely matches a previously confirmed false "dam has burst" rumour pattern, current rainfall at the claimed location is minimal, and the point is outside any mapped flood-risk zone. No independent evidence of flooding was found.',
   'Ujumbe huu unafanana sana na uzushi uliothibitishwa awali wa "dam imepasuka", mvua ya sasa mahali palipotajwa ni kidogo, na eneo liko nje ya ukanda wowote wa hatari ya mafuriko.',
   '{"rumor_similarity":0.91,"matched_pattern":"dam_burst","rainfall_mm_3h":2.1,"risk_zone":false}'::jsonb,
   'risk-engine-1.0.0', 'sandbox-rationale-v1', 'sandbox', now() - interval '88 minutes'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'elevated_risk', 0.61, false,
   'Moderate rainfall and a degraded (not fully confirmed) flood-risk reading for this point put this in the elevated-risk band; monitor and prepare, evacuation is not yet clearly warranted.',
   'Mvua ya wastani na usomaji usio kamili wa hatari ya mafuriko kwa eneo hili unaweka hali katika kiwango cha hatari inayoongezeka; fuatilia na jiandae.',
   '{"rainfall_mm_3h":22.0,"risk_zone_quality":"degraded"}'::jsonb,
   'risk-engine-1.0.0', 'sandbox-rationale-v1', 'sandbox', now() - interval '43 minutes')
on conflict (id) do nothing;

-- Report 4 is deliberately NOT auto-classified — evidence is unavailable
-- (no river/ambassador ground-truth yet), so the engine routes it to human
-- escalation instead of guessing. This is the safety rule in action.
insert into public.escalations (id, report_id, reason, status, created_at)
values
  ('80000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004',
   'Insufficient evidence: no rainfall/river/ambassador ground-truth available for this point yet, and the report itself is ambiguous (no direct observation, only concern about a forwarded voice note). Routed to a human rather than guessed.',
   'open', now() - interval '19 minutes')
on conflict (id) do nothing;

insert into public.alerts (id, classification_id, pilot_area_id, message_en, message_sw, channels, status, created_at)
values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'VERIFIED FLOOD WARNING — Kanini Road area, Mukuru kwa Reuben. Water is rising. Move to higher ground now and avoid the railway crossing. Verified by FloodFact AI using live rainfall and flood-risk data. Issued ' || to_char(now() - interval '2 hours 55 minutes', 'HH24:MI') || '.',
   'ONYO LILILOTHIBITISHWA LA MAFURIKO — eneo la Kanini Road, Mukuru kwa Reuben. Maji yanapanda. Hamia mahali pa juu sasa na epuka njia panda ya reli.',
   array['whatsapp', 'sms', 'notice_board'], 'sent', now() - interval '2 hours 55 minutes'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   'This claim is FALSE — no dam has burst near Mukuru kwa Njenga. Current evidence shows no flooding risk at this location. Please do not reshare the voice note. Verified by FloodFact AI.',
   'Madai haya SI KWELI — hakuna dam iliyopasuka karibu na Mukuru kwa Njenga. Tafadhali usisambaze tena ujumbe huo wa sauti.',
   array['whatsapp', 'sms'], 'sent', now() - interval '85 minutes'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
   'ELEVATED FLOOD RISK — Viwandani, near Likoni Road. Moderate rainfall and drainage blockage reported. Monitor conditions and keep valuables off the floor. Verified by FloodFact AI.',
   'HATARI YA MAFURIKO INAYOONGEZEKA — Viwandani, karibu na Likoni Road. Mvua ya wastani imeripotiwa.',
   array['whatsapp', 'ambassador_queue'], 'sent', now() - interval '40 minutes')
on conflict (id) do nothing;

insert into public.alert_deliveries (alert_id, channel, recipient_ref, status, created_at)
values
  ('50000000-0000-0000-0000-000000000001', 'whatsapp', 'seed-recipient-hash-a', 'delivered', now() - interval '2 hours 53 minutes'),
  ('50000000-0000-0000-0000-000000000001', 'sms', 'seed-recipient-hash-b', 'delivered', now() - interval '2 hours 52 minutes'),
  ('50000000-0000-0000-0000-000000000002', 'whatsapp', 'seed-recipient-hash-c', 'delivered', now() - interval '83 minutes'),
  ('50000000-0000-0000-0000-000000000003', 'whatsapp', 'seed-recipient-hash-d', 'sent', now() - interval '38 minutes')
on conflict do nothing;

insert into public.ambassador_observations (ambassador_id, report_id, pilot_area_id, observation_type, measurement, confirmed, notes, recorded_at)
values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'visual_confirmation', null, true, 'Confirmed knee-height water on Kanini Road in person, helped two households move belongings.', now() - interval '2 hours 40 minutes'),
  ('20000000-0000-0000-0000-000000000001', null, '10000000-0000-0000-0000-000000000001',
   'household_reached', 34, null, 'Went door to door along Kanini Road relaying the verified warning.', now() - interval '2 hours 30 minutes'),
  ('20000000-0000-0000-0000-000000000003', null, '10000000-0000-0000-0000-000000000002',
   'household_reached', 51, null, 'Shared the false-information correction in the ward WhatsApp group and in person.', now() - interval '80 minutes'),
  ('20000000-0000-0000-0000-000000000005', null, '10000000-0000-0000-0000-000000000003',
   'household_reached', 22, null, 'Relayed elevated-risk notice to households along Likoni Road.', now() - interval '35 minutes')
on conflict do nothing;
