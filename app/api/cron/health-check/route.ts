import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { getRainfallEvidence } from "@/lib/providers/weather-openmeteo";
import { getFloodRiskEvidence } from "@/lib/providers/flood-risk-arcgis";
import { getRiverLevelEvidence } from "@/lib/providers/river-level";

// Mukuru kwa Reuben's real ward centroid (OSM "Kwa Reuben ward", see
// supabase/migrations/20260902000100_real_pilot_area_boundaries.sql) — a
// real point inside the active pilot area, used purely to exercise each
// provider so the ops dashboard's source-health panel reflects current
// status even during quiet periods with no reports.
const TEST_POINT = { lat: -1.3152004, lon: 36.8820407 };

/** Invoked on a schedule (see .github/workflows/health-check.yml) — evidence itself is always fetched per-report, not cached here. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [rainfall, riskZone, river] = await Promise.allSettled([
    getRainfallEvidence(TEST_POINT),
    getFloodRiskEvidence(TEST_POINT),
    getRiverLevelEvidence(TEST_POINT),
  ]);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    open_meteo: rainfall.status === "fulfilled" ? rainfall.value.quality : "error",
    arcgis_flood_risk: riskZone.status === "fulfilled" ? riskZone.value.quality : "error",
    river_level: river.status === "fulfilled" ? river.value.quality : "error",
  });
}
