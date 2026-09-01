import "server-only";
import { recordSourceHealth } from "@/lib/data/source-health";
import type { GeoPoint } from "../shared";

export interface RiverLevelReading {
  source: "river_level";
  quality: "ok" | "degraded" | "unavailable";
  waterLevelM: number | null;
  trend: "rising" | "falling" | "stable" | null;
}

/**
 * Documented non-implementation.
 *
 * Kenya has no open, real-time river-gauge telemetry API suitable for a
 * synchronous per-report lookup. The Copernicus Global Flood Awareness
 * System (GloFAS) publishes river-discharge forecasts that could cover this
 * in Phase 2, but its access pattern (the `cdsapi` async submit/poll/
 * download-a-NetCDF-file flow) doesn't fit a request-time evidence check —
 * it would need its own scheduled ingestion job, not a live call here.
 *
 * Rather than fabricate a plausible-looking reading with no real source
 * behind it, this always reports "unavailable". Phase 1's actual
 * ground-truth water-level signal is real: trained ambassadors log it
 * directly (see AmbassadorGroundTruthEvidence / ambassador_observations),
 * which is both more honest and more immediately actionable than a
 * kilometers-away river gauge would be for a specific settlement's report.
 * See docs/DATA_SOURCES.md for the GloFAS integration this can become.
 */
export async function getRiverLevelEvidence(_point: GeoPoint): Promise<RiverLevelReading> {
  await recordSourceHealth("river_level", "live", {
    ok: false,
    error: "No live river-gauge source configured (see docs/DATA_SOURCES.md)",
  });
  return { source: "river_level", quality: "unavailable", waterLevelM: null, trend: null };
}
