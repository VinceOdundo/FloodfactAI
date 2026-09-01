import "server-only";
import type { RainfallEvidence } from "@/lib/core/types";
import { hourBucketSeed, seededRandom, SANDBOX_QUALITY, type GeoPoint } from "../shared";

/** Deterministic, location- and hour-stable synthetic rainfall — never presented as live data. */
export function getRainfallSandbox(point: GeoPoint): RainfallEvidence {
  const r = seededRandom(hourBucketSeed(point, "rainfall"));
  // Skewed toward light rain with an occasional heavy-rain tail, roughly
  // matching Nairobi long-rain-season variability.
  const mm3h = Math.round(Math.pow(r, 2.2) * 45 * 10) / 10;
  return { source: "open_meteo", quality: SANDBOX_QUALITY, mm3h };
}
