import "server-only";
import { env } from "@/lib/config/env";
import type { FloodRiskZoneEvidence } from "@/lib/core/types";
import { fetchWithTimeout, type GeoPoint } from "../shared";

interface ArcGisQueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: { code: number; message: string };
}

// Common field-name candidates across public flood-hazard layers. Esri
// datasets don't share one schema, so this is a best-effort lookup — a
// specific licensed layer may need its field name added here.
const RISK_LEVEL_FIELDS = ["RiskLevel", "Risk_Level", "HAZARD", "hazard_class", "flood_risk", "FLOOD_RISK"];

/**
 * Queries the ArcGIS FeatureServer/MapServer layer configured via
 * ARCGIS_FLOOD_LAYER_URL for polygons intersecting the report's point. This
 * is Esri's standard, stable REST query convention — it works with any
 * hosted layer (Living Atlas, a JRC Global Flood Hazard mirror, or the
 * team's own uploaded risk polygons), which is why the specific layer is a
 * deployment-time config value rather than hardcoded here.
 */
export async function getFloodRiskLive(point: GeoPoint): Promise<FloodRiskZoneEvidence> {
  if (!env.ARCGIS_FLOOD_LAYER_URL) {
    throw new Error("ARCGIS_FLOOD_LAYER_URL is not configured");
  }

  const params = new URLSearchParams({
    f: "json",
    geometry: `${point.lon},${point.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
  });
  if (env.ARCGIS_API_KEY) params.set("token", env.ARCGIS_API_KEY);

  const res = await fetchWithTimeout(`${env.ARCGIS_FLOOD_LAYER_URL}/query?${params.toString()}`, {
    timeoutMs: 8000,
  });
  if (!res.ok) {
    throw new Error(`ArcGIS layer responded ${res.status}`);
  }
  const data = (await res.json()) as ArcGisQueryResponse;
  if (data.error) {
    throw new Error(`ArcGIS layer error ${data.error.code}: ${data.error.message}`);
  }

  const features = data.features ?? [];
  const inRiskZone = features.length > 0;
  const riskLevel = inRiskZone ? extractRiskLevel(features[0]?.attributes) : "low";

  return { source: "arcgis_flood_risk", quality: "ok", inRiskZone, riskLevel };
}

function extractRiskLevel(attributes?: Record<string, unknown>): FloodRiskZoneEvidence["riskLevel"] {
  if (!attributes) return "moderate";
  for (const field of RISK_LEVEL_FIELDS) {
    const value = attributes[field];
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized.includes("high") || normalized.includes("severe")) return "high";
      if (normalized.includes("low")) return "low";
      if (normalized.includes("mod")) return "moderate";
    }
  }
  return "moderate";
}
