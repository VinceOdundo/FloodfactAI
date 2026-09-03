import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { buildAlertMessage } from "@/lib/core/alert-templates";
import { parseEwkbPoint, parseEwkbPolygon } from "@/lib/core/geo-wkb";
import {
  FIXTURE_AMBASSADORS,
  FIXTURE_DATA_SOURCE_HEALTH,
  FIXTURE_ESCALATIONS,
  FIXTURE_HISTORICAL_EVENTS,
  FIXTURE_PILOT_AREAS,
  FIXTURE_PILOT_METRICS,
  FIXTURE_REPORTS,
} from "@/lib/data/fixtures";

// All queries here use the session-aware client (lib/supabase/server), so
// RLS is the real enforcement path for admin reads — not just an app-level
// check that happens to agree with it.

export type ClassificationLabel = "verified_warning" | "elevated_risk" | "false_information";

export interface ReportListItem {
  id: string;
  sourceChannel: string;
  rawText: string;
  pilotAreaId: string | null;
  pilotAreaName: string | null;
  hazardType: string;
  status: string;
  createdAt: string;
  classification: {
    classification: ClassificationLabel;
    confidence: number;
    insufficientEvidence: boolean;
    rationaleEn: string;
  } | null;
}

export async function listReports(limit = 50): Promise<ReportListItem[]> {
  if (isDemoMode()) {
    return FIXTURE_REPORTS.map((r) => ({ ...r }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "id, source_channel, raw_text, pilot_area_id, hazard_type, status, created_at, pilot_areas(name), classifications(classification, confidence, insufficient_evidence, rationale_en, created_at)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    const classifications = (r.classifications as unknown as Array<{
      classification: ClassificationLabel;
      confidence: number;
      insufficient_evidence: boolean;
      rationale_en: string;
      created_at: string;
    }>) ?? [];
    const latest = [...classifications].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    return {
      id: r.id,
      sourceChannel: r.source_channel,
      rawText: r.raw_text,
      pilotAreaId: r.pilot_area_id,
      pilotAreaName: (r.pilot_areas as unknown as { name: string } | null)?.name ?? null,
      hazardType: r.hazard_type,
      status: r.status,
      createdAt: r.created_at,
      classification: latest
        ? {
            classification: latest.classification,
            confidence: latest.confidence,
            insufficientEvidence: latest.insufficient_evidence,
            rationaleEn: latest.rationale_en,
          }
        : null,
    };
  });
}

export interface ReportSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  classification?: ClassificationLabel;
  pilotAreaId?: string;
  from?: string;
  to?: string;
  q?: string;
}

export interface ReportSearchResult {
  items: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated, filterable report search for /admin/reports — the dashboard's
 * `listReports(15)` feed has no filters, search, or paging beyond a flat
 * cap, which doesn't hold up once a pilot has more than a screenful of
 * reports.
 */
export async function searchReports(params: ReportSearchParams = {}): Promise<ReportSearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 20;

  if (isDemoMode()) {
    let items = FIXTURE_REPORTS.map((r) => ({ ...r })) as ReportListItem[];
    if (params.status) items = items.filter((r) => r.status === params.status);
    if (params.classification) {
      items = items.filter((r) => r.classification?.classification === params.classification);
    }
    if (params.pilotAreaId) items = items.filter((r) => r.pilotAreaId === params.pilotAreaId);
    if (params.from) items = items.filter((r) => r.createdAt >= params.from!);
    if (params.to) items = items.filter((r) => r.createdAt <= params.to!);
    if (params.q) {
      const needle = params.q.toLowerCase();
      items = items.filter((r) => r.rawText.toLowerCase().includes(needle));
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  const supabase = await createClient();
  const start = (page - 1) * pageSize;

  // Two separate literal `.select()` calls, not one built from a variable:
  // PostgREST's embedded-resource filter (`classifications.classification`)
  // only *restricts* reports (rather than just filtering which nested rows
  // come back) when the relation is `!inner`-joined — but joining `!inner`
  // unconditionally would silently drop every not-yet-classified report
  // (pending/processing) from every search, filtered or not. A dynamic
  // select string also loses Supabase's generated row typing entirely
  // (falls back to an untyped `GenericStringError`), so this keeps each
  // branch a real literal instead of trying to share one query variable.
  const { data, count } = params.classification
    ? await (() => {
        let q = supabase
          .from("reports")
          .select(
            "id, source_channel, raw_text, pilot_area_id, hazard_type, status, created_at, pilot_areas(name), classifications!inner(classification, confidence, insufficient_evidence, rationale_en, created_at)",
            { count: "exact" }
          )
          .eq("classifications.classification", params.classification);
        if (params.status) q = q.eq("status", params.status);
        if (params.pilotAreaId) q = q.eq("pilot_area_id", params.pilotAreaId);
        if (params.from) q = q.gte("created_at", params.from);
        if (params.to) q = q.lte("created_at", params.to);
        if (params.q) q = q.ilike("raw_text", `%${params.q}%`);
        return q.order("created_at", { ascending: false }).range(start, start + pageSize - 1);
      })()
    : await (() => {
        let q = supabase
          .from("reports")
          .select(
            "id, source_channel, raw_text, pilot_area_id, hazard_type, status, created_at, pilot_areas(name), classifications(classification, confidence, insufficient_evidence, rationale_en, created_at)",
            { count: "exact" }
          );
        if (params.status) q = q.eq("status", params.status);
        if (params.pilotAreaId) q = q.eq("pilot_area_id", params.pilotAreaId);
        if (params.from) q = q.gte("created_at", params.from);
        if (params.to) q = q.lte("created_at", params.to);
        if (params.q) q = q.ilike("raw_text", `%${params.q}%`);
        return q.order("created_at", { ascending: false }).range(start, start + pageSize - 1);
      })();

  const items = (data ?? []).map((r) => {
    const classifications = (r.classifications as unknown as Array<{
      classification: ClassificationLabel;
      confidence: number;
      insufficient_evidence: boolean;
      rationale_en: string;
      created_at: string;
    }>) ?? [];
    const latest = [...classifications].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    return {
      id: r.id,
      sourceChannel: r.source_channel,
      rawText: r.raw_text,
      pilotAreaId: r.pilot_area_id,
      pilotAreaName: (r.pilot_areas as unknown as { name: string } | null)?.name ?? null,
      hazardType: r.hazard_type,
      status: r.status,
      createdAt: r.created_at,
      classification: latest
        ? {
            classification: latest.classification,
            confidence: latest.confidence,
            insufficientEvidence: latest.insufficient_evidence,
            rationaleEn: latest.rationale_en,
          }
        : null,
    };
  });

  return { items, total: count ?? items.length, page, pageSize };
}

export interface EscalationItem {
  id: string;
  reportId: string;
  pilotAreaName: string | null;
  reason: string;
  status: "open" | "in_review" | "resolved";
  createdAt: string;
}

export async function listEscalations(): Promise<EscalationItem[]> {
  if (isDemoMode()) {
    return FIXTURE_ESCALATIONS.map((e) => ({ ...e }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("escalations")
    .select("id, report_id, reason, status, created_at, reports(pilot_areas(name))")
    .order("created_at", { ascending: false });
  return (data ?? []).map((e) => ({
    id: e.id,
    reportId: e.report_id,
    pilotAreaName:
      ((e.reports as unknown as { pilot_areas: { name: string } | null } | null)?.pilot_areas)?.name ?? null,
    reason: e.reason,
    status: e.status,
    createdAt: e.created_at,
  }));
}

export interface PilotMetricRow {
  pilotAreaId: string;
  pilotAreaSlug: string;
  pilotAreaName: string;
  reportsTotal: number;
  falseInformationRatePct: number | null;
  avgVerificationSeconds: number | null;
  alertsTotal: number;
  alertsWithin30MinPct: number | null;
  ambassadorsActive: number;
  ambassadorsTrainedPct: number | null;
  householdsReachedTotal: number;
}

export async function getPilotMetrics(): Promise<PilotMetricRow[]> {
  if (isDemoMode()) {
    return FIXTURE_PILOT_METRICS.map((m) => ({ ...m }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("pilot_metrics")
    .select("*")
    .eq("is_active_pilot", true)
    .order("pilot_area_slug");
  return (data ?? []).map((m) => ({
    pilotAreaId: m.pilot_area_id,
    pilotAreaSlug: m.pilot_area_slug,
    pilotAreaName: m.pilot_area_name,
    reportsTotal: m.reports_total,
    falseInformationRatePct: m.false_information_rate_pct,
    avgVerificationSeconds: m.avg_verification_seconds,
    alertsTotal: m.alerts_total,
    alertsWithin30MinPct: m.alerts_within_30min_pct,
    ambassadorsActive: m.ambassadors_active,
    ambassadorsTrainedPct: m.ambassadors_trained_pct,
    householdsReachedTotal: m.households_reached_total,
  }));
}

export interface DataSourceHealthRow {
  source: string;
  mode: "live" | "sandbox";
  status: "ok" | "degraded" | "down" | "unknown";
  lastSuccessAt: string | null;
}

export async function getDataSourceHealth(): Promise<DataSourceHealthRow[]> {
  if (isDemoMode()) {
    return FIXTURE_DATA_SOURCE_HEALTH.map((h) => ({ ...h }));
  }
  const supabase = await createClient();
  const { data } = await supabase.from("data_source_health").select("source, mode, status, last_success_at");
  return (data ?? []).map((h) => ({ source: h.source, mode: h.mode, status: h.status, lastSuccessAt: h.last_success_at }));
}

export interface ReportDetail extends ReportListItem {
  claimedLocationText: string | null;
  evidence: Array<{ source: string; quality: string; numericValue: number | null; fetchedAt: string }>;
  alerts: Array<{ id: string; messageEn: string; status: string; deliveries: Array<{ channel: string; status: string; error: string | null }> }>;
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  if (isDemoMode()) {
    const fixture = FIXTURE_REPORTS.find((r) => r.id === id);
    if (!fixture) return null;
    return {
      ...fixture,
      claimedLocationText: fixture.pilotAreaName,
      evidence: [
        { source: "open_meteo", quality: "degraded", numericValue: 24.5, fetchedAt: fixture.createdAt },
        { source: "arcgis_flood_risk", quality: "degraded", numericValue: 1, fetchedAt: fixture.createdAt },
      ],
      alerts:
        fixture.classification && fixture.classification.classification !== undefined
          ? [
              {
                id: "demo-alert",
                messageEn: buildAlertMessage(fixture.classification.classification, {
                  pilotAreaName: fixture.pilotAreaName,
                  locationDetail: null,
                  issuedAt: new Date(fixture.createdAt),
                  topRationale: [fixture.classification.rationaleEn],
                }).en,
                status: "sent",
                deliveries: [{ channel: "ambassador_queue", status: "sent", error: null }],
              },
            ]
          : [],
    };
  }

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("reports")
    .select(
      "id, source_channel, raw_text, claimed_location_text, pilot_area_id, hazard_type, status, created_at, pilot_areas(name), classifications(id, classification, confidence, insufficient_evidence, rationale_en, created_at)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;

  const classifications = (r.classifications as unknown as Array<{
    id: string;
    classification: ClassificationLabel;
    confidence: number;
    insufficient_evidence: boolean;
    rationale_en: string;
    created_at: string;
  }>) ?? [];
  const latest = [...classifications].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const { data: evidenceRows } = await supabase
    .from("evidence_items")
    .select("source, quality, numeric_value, fetched_at")
    .eq("report_id", id)
    .order("fetched_at", { ascending: true });

  let alerts: ReportDetail["alerts"] = [];
  if (latest) {
    const { data: alertRows } = await supabase
      .from("alerts")
      .select("id, message_en, status, alert_deliveries(channel, status, error)")
      .eq("classification_id", latest.id);
    alerts = (alertRows ?? []).map((a) => ({
      id: a.id,
      messageEn: a.message_en,
      status: a.status,
      deliveries: (a.alert_deliveries as unknown as Array<{ channel: string; status: string; error: string | null }>) ?? [],
    }));
  }

  return {
    id: r.id,
    sourceChannel: r.source_channel,
    rawText: r.raw_text,
    claimedLocationText: r.claimed_location_text,
    pilotAreaId: r.pilot_area_id,
    pilotAreaName: (r.pilot_areas as unknown as { name: string } | null)?.name ?? null,
    hazardType: r.hazard_type,
    status: r.status,
    createdAt: r.created_at,
    classification: latest
      ? {
          classification: latest.classification,
          confidence: latest.confidence,
          insufficientEvidence: latest.insufficient_evidence,
          rationaleEn: latest.rationale_en,
        }
      : null,
    evidence: (evidenceRows ?? []).map((e) => ({
      source: e.source,
      quality: e.quality,
      numericValue: e.numeric_value,
      fetchedAt: e.fetched_at,
    })),
    alerts,
  };
}

export interface PilotAreaMapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  boundary: [number, number][] | null;
  populationEstimate: number | null;
  isActivePilot: boolean;
  latestClassification: ClassificationLabel | null;
  openEscalations: number;
}

/**
 * By default, only the 3 active Phase-1 wards — matching "N pilot areas"
 * stat tiles elsewhere on the overview page. Pass includeReference for the
 * full GIS map, where Kibera/Mathare's historical context is the point.
 */
export async function getPilotAreaMapPoints(includeReference = false): Promise<PilotAreaMapPoint[]> {
  if (isDemoMode()) {
    const overlay: Record<string, { latestClassification: ClassificationLabel | null; openEscalations: number }> = {
      "10000000-0000-0000-0000-000000000001": { latestClassification: "verified_warning", openEscalations: 1 },
      "10000000-0000-0000-0000-000000000002": { latestClassification: "false_information", openEscalations: 0 },
      "10000000-0000-0000-0000-000000000003": { latestClassification: "elevated_risk", openEscalations: 0 },
    };
    return FIXTURE_PILOT_AREAS.filter((a) => includeReference || a.isActivePilot).map((a) => ({
      id: a.id,
      name: a.name,
      lon: a.centroid[0],
      lat: a.centroid[1],
      boundary: [...a.boundary],
      populationEstimate: a.populationEstimate,
      isActivePilot: a.isActivePilot,
      latestClassification: overlay[a.id]?.latestClassification ?? null,
      openEscalations: overlay[a.id]?.openEscalations ?? 0,
    }));
  }

  const supabase = await createClient();
  let query = supabase.from("pilot_areas").select("id, name, centroid, boundary, population_estimate, is_active_pilot");
  if (!includeReference) query = query.eq("is_active_pilot", true);
  const { data: areas } = await query;

  const points: PilotAreaMapPoint[] = [];
  for (const area of areas ?? []) {
    const coords = typeof area.centroid === "string" ? parseEwkbPoint(area.centroid) : null;
    if (!coords) continue;
    const boundaryCoords = typeof area.boundary === "string" ? parseEwkbPolygon(area.boundary) : null;

    const { data: latest } = await supabase
      .from("reports")
      .select("classifications(classification, created_at)")
      .eq("pilot_area_id", area.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const classifications = (latest?.classifications as unknown as Array<{ classification: ClassificationLabel }>) ?? [];

    const { count } = await supabase
      .from("escalations")
      .select("id, reports!inner(pilot_area_id)", { count: "exact", head: true })
      .eq("status", "open")
      .eq("reports.pilot_area_id", area.id);

    points.push({
      id: area.id,
      name: area.name,
      lon: coords.lon,
      lat: coords.lat,
      boundary: boundaryCoords,
      populationEstimate: area.population_estimate,
      isActivePilot: area.is_active_pilot,
      latestClassification: classifications[0]?.classification ?? null,
      openEscalations: count ?? 0,
    });
  }
  return points;
}

export interface HistoricalEventPoint {
  id: string;
  locationName: string;
  eventDate: string;
  description: string;
  source: string;
  severity: "minor" | "moderate" | "severe" | "catastrophic" | null;
  deaths: number | null;
  householdsAffected: number | null;
  lat: number;
  lon: number;
}

export async function getHistoricalFloodEvents(): Promise<HistoricalEventPoint[]> {
  if (isDemoMode()) {
    const centroidByArea = new Map(FIXTURE_PILOT_AREAS.map((a) => [a.id, a.centroid]));
    return FIXTURE_HISTORICAL_EVENTS.map((e) => {
      const centroid = centroidByArea.get(e.pilotAreaId);
      return {
        id: e.id,
        locationName: e.locationName,
        eventDate: e.eventDate,
        description: e.description,
        source: e.source,
        severity: e.severity,
        deaths: e.deaths,
        householdsAffected: e.householdsAffected,
        lon: centroid?.[0] ?? 36.8676,
        lat: centroid?.[1] ?? -1.3086,
      };
    });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("historical_flood_events")
    .select("id, location_name, event_date, description, source, severity, deaths, households_affected, pilot_areas(centroid)")
    .order("event_date", { ascending: false });

  return (data ?? []).flatMap((e) => {
    const centroidHex = (e.pilot_areas as unknown as { centroid: string | null } | null)?.centroid ?? null;
    const coords = typeof centroidHex === "string" ? parseEwkbPoint(centroidHex) : null;
    if (!coords) return [];
    return [
      {
        id: e.id,
        locationName: e.location_name,
        eventDate: e.event_date,
        description: e.description,
        source: e.source,
        severity: e.severity,
        deaths: e.deaths,
        householdsAffected: e.households_affected,
        lon: coords.lon,
        lat: coords.lat,
      },
    ];
  });
}

export interface AmbassadorRow {
  id: string;
  fullName: string;
  pilotAreaName: string | null;
  trainingStatus: "not_started" | "in_progress" | "trained";
  active: boolean;
}

export async function listAmbassadors(): Promise<AmbassadorRow[]> {
  if (isDemoMode()) {
    return FIXTURE_AMBASSADORS.map((a) => ({ ...a }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("ambassadors")
    .select("id, full_name, training_status, active, pilot_areas(name)")
    .order("full_name");
  return (data ?? []).map((a) => ({
    id: a.id,
    fullName: a.full_name,
    pilotAreaName: (a.pilot_areas as unknown as { name: string } | null)?.name ?? null,
    trainingStatus: a.training_status,
    active: a.active,
  }));
}

export interface PilotAreaOption {
  id: string;
  name: string;
}

/** Active pilot areas only — for the ambassador-onboarding form's dropdown. */
export async function listActivePilotAreasForSelect(): Promise<PilotAreaOption[]> {
  if (isDemoMode()) {
    return FIXTURE_PILOT_AREAS.filter((a) => a.isActivePilot).map((a) => ({ id: a.id, name: a.name }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("pilot_areas")
    .select("id, name")
    .eq("is_active_pilot", true)
    .order("name");
  return data ?? [];
}
