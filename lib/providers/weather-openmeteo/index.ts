import "server-only";
import type { RainfallEvidence } from "@/lib/core/types";
import { isDemoMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import type { GeoPoint } from "../shared";
import { getRainfallLive } from "./live";
import { getRainfallSandbox } from "./sandbox";

/**
 * Open-Meteo is free and keyless, so "live" is always attempted unless the
 * app is explicitly in demo mode. A genuine network/API failure returns
 * quality "unavailable" — it never silently falls back to fabricated data.
 */
export async function getRainfallEvidence(point: GeoPoint): Promise<RainfallEvidence> {
  if (isDemoMode()) {
    return getRainfallSandbox(point);
  }

  try {
    const result = await getRainfallLive(point);
    await recordSourceHealth("open_meteo", "live", { ok: true });
    return result;
  } catch (error) {
    await recordSourceHealth("open_meteo", "live", { ok: false, error });
    return { source: "open_meteo", quality: "unavailable", mm3h: null };
  }
}
