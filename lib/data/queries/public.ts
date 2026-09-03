import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";
import { parseEwkbPoint, parseEwkbPolygon } from "@/lib/core/geo-wkb";
import { FIXTURE_PILOT_AREAS, FIXTURE_PILOT_METRICS, FIXTURE_PUBLIC_ALERTS } from "@/lib/data/fixtures";

export interface PublicAlert {
  id: string;
  pilotAreaName: string | null;
  classification: "verified_warning" | "elevated_risk";
  messageEn: string;
  messageSw: string | null;
  createdAt: string;
}

export async function getPublicAlertFeed(limit = 20): Promise<PublicAlert[]> {
  if (isDemoMode()) {
    return FIXTURE_PUBLIC_ALERTS.map((a) => ({ ...a, messageSw: null }));
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("public_alert_feed")
    .select("id, pilot_area_name, classification, message_en, message_sw, created_at")
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    pilotAreaName: r.pilot_area_name,
    classification: r.classification,
    messageEn: r.message_en,
    messageSw: r.message_sw,
    createdAt: r.created_at,
  }));
}

export interface PublicPilotAreaBoundary {
  id: string;
  name: string;
  lat: number;
  lon: number;
  boundary: [number, number][] | null;
}

/**
 * Ward name + boundary only — no classification/escalation status, unlike
 * the admin GIS map's `getPilotAreaMapPoints`. `pilot_areas` is public-read
 * by RLS design (ward names/boundaries aren't sensitive; see
 * 0004_rls_policies.sql), but operational state is admin/ambassador-only.
 */
export async function getActivePilotAreaBoundaries(): Promise<PublicPilotAreaBoundary[]> {
  if (isDemoMode()) {
    return FIXTURE_PILOT_AREAS.filter((a) => a.isActivePilot).map((a) => ({
      id: a.id,
      name: a.name,
      lon: a.centroid[0],
      lat: a.centroid[1],
      boundary: [...a.boundary],
    }));
  }
  const supabase = createServiceClient();
  const { data: areas } = await supabase
    .from("pilot_areas")
    .select("id, name, centroid, boundary")
    .eq("is_active_pilot", true);

  const points: PublicPilotAreaBoundary[] = [];
  for (const area of areas ?? []) {
    const coords = typeof area.centroid === "string" ? parseEwkbPoint(area.centroid) : null;
    if (!coords) continue;
    const boundaryCoords = typeof area.boundary === "string" ? parseEwkbPolygon(area.boundary) : null;
    points.push({ id: area.id, name: area.name, lon: coords.lon, lat: coords.lat, boundary: boundaryCoords });
  }
  return points;
}

export interface HeadlineStats {
  pilotAreasActive: number;
  reportsTotal: number;
  falseInformationCaught: number;
  avgVerificationSeconds: number | null;
}

export async function getHeadlineStats(): Promise<HeadlineStats> {
  if (isDemoMode()) {
    const reportsTotal = FIXTURE_PILOT_METRICS.reduce((s, m) => s + m.reportsTotal, 0);
    const falseInfo = FIXTURE_PILOT_METRICS.reduce((s, m) => s + (m.reportsTotal * m.falseInformationRatePct) / 100, 0);
    return {
      pilotAreasActive: FIXTURE_PILOT_AREAS.filter((a) => a.isActivePilot).length,
      reportsTotal,
      falseInformationCaught: Math.round(falseInfo),
      avgVerificationSeconds: 120,
    };
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("pilot_metrics")
    .select("reports_total, false_information_total, avg_verification_seconds, is_active_pilot")
    .eq("is_active_pilot", true);
  const rows = data ?? [];
  const reportsTotal = rows.reduce((s, r) => s + (r.reports_total ?? 0), 0);
  const falseInformationCaught = rows.reduce((s, r) => s + (r.false_information_total ?? 0), 0);
  const verificationTimes = rows.map((r) => r.avg_verification_seconds).filter((v): v is number => v != null);
  return {
    pilotAreasActive: rows.length,
    reportsTotal,
    falseInformationCaught,
    avgVerificationSeconds: verificationTimes.length ? verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length : null,
  };
}
