import "server-only";
import type { FloodRiskZoneEvidence } from "@/lib/core/types";
import { hourBucketSeed, seededRandom, SANDBOX_QUALITY, type GeoPoint } from "../shared";

/** Deterministic, location-stable synthetic risk-zone reading — used when no ArcGIS layer is configured. */
export function getFloodRiskSandbox(point: GeoPoint): FloodRiskZoneEvidence {
  const r = seededRandom(hourBucketSeed(point, "flood-risk"));
  const inRiskZone = r > 0.4;
  return {
    source: "arcgis_flood_risk",
    quality: SANDBOX_QUALITY,
    inRiskZone,
    riskLevel: inRiskZone ? (r > 0.75 ? "high" : "moderate") : "low",
  };
}
