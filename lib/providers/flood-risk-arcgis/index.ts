import "server-only";
import type { FloodRiskZoneEvidence } from "@/lib/core/types";
import { providerMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import type { GeoPoint } from "../shared";
import { getFloodRiskLive } from "./live";
import { getFloodRiskSandbox } from "./sandbox";

export async function getFloodRiskEvidence(point: GeoPoint): Promise<FloodRiskZoneEvidence> {
  const mode = providerMode.floodRisk();
  if (mode === "sandbox") {
    return getFloodRiskSandbox(point);
  }

  try {
    const result = await getFloodRiskLive(point);
    await recordSourceHealth("arcgis_flood_risk", "live", { ok: true });
    return result;
  } catch (error) {
    await recordSourceHealth("arcgis_flood_risk", "live", { ok: false, error });
    return { source: "arcgis_flood_risk", quality: "unavailable", inRiskZone: null, riskLevel: null };
  }
}
