-- Migration: Upgrade public_alert_feed view with full evidence-derived telemetry fields
-- Applies to: hckcohornkwqlibbfpwg (FloodFact Supabase project)
-- Applied: 2026-09-21 via MCP supabase.execute_sql
--
-- Adds to the public view (readable by the anon role via RLS on base tables):
--   landmark               - NLU-extracted claimed location text from the report
--   rainfall_mm_per_hour   - Latest open_meteo numeric evidence value (mm)
--   river_level_status     - Quality string from river_level evidence source
--   ambassador_count       - Number of ambassador_observations corroborating the report
--   verification_speed_sec - Seconds elapsed from report creation to classification

CREATE OR REPLACE VIEW public.public_alert_feed AS
SELECT
  al.id,
  al.message_en,
  al.message_sw,
  pa.name AS pilot_area_name,
  c.classification,
  al.created_at,

  -- Landmark: NLU-extracted claimed location from the underlying report
  nlu.claimed_location_text AS landmark,

  -- Rainfall: latest Open-Meteo numeric value for the report's evidence
  (
    SELECT ei.numeric_value
    FROM evidence_items ei
    WHERE ei.report_id = r.id
      AND ei.source = 'open_meteo'
    ORDER BY ei.fetched_at DESC
    LIMIT 1
  ) AS rainfall_mm_per_hour,

  -- River level: quality string from river gauge evidence
  (
    SELECT ei.quality
    FROM evidence_items ei
    WHERE ei.report_id = r.id
      AND ei.source = 'river_level'
    ORDER BY ei.fetched_at DESC
    LIMIT 1
  ) AS river_level_status,

  -- Ambassador corroboration count
  (
    SELECT COUNT(*)::int
    FROM ambassador_observations ao
    WHERE ao.report_id = r.id
  ) AS ambassador_count,

  -- Verification speed: seconds from report receipt to classification
  EXTRACT(EPOCH FROM (c.created_at - r.created_at))::int AS verification_speed_seconds

FROM alerts al
JOIN classifications c ON c.id = al.classification_id
JOIN reports r ON r.id = c.report_id
LEFT JOIN pilot_areas pa ON pa.id = al.pilot_area_id
LEFT JOIN nlu_extractions nlu ON nlu.report_id = r.id
WHERE
  c.classification IN ('verified_warning', 'elevated_risk')
  AND al.status IN ('sent', 'partial')
ORDER BY al.created_at DESC;
