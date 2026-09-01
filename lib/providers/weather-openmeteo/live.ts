import "server-only";
import { env } from "@/lib/config/env";
import type { RainfallEvidence } from "@/lib/core/types";
import { fetchWithTimeout, type GeoPoint } from "../shared";

interface OpenMeteoResponse {
  hourly?: { time: string[]; precipitation: number[] };
}

/** Real call to Open-Meteo's free, keyless forecast API — summed precipitation over the last ~3 hours. */
export async function getRainfallLive(point: GeoPoint): Promise<RainfallEvidence> {
  const url =
    `${env.OPEN_METEO_BASE_URL}/v1/forecast` +
    `?latitude=${point.lat}&longitude=${point.lon}` +
    `&hourly=precipitation&past_hours=3&forecast_hours=0&timezone=Africa%2FNairobi`;

  const res = await fetchWithTimeout(url, { timeoutMs: 6000 });
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}`);
  }
  const data = (await res.json()) as OpenMeteoResponse;
  const readings = data.hourly?.precipitation ?? [];
  if (readings.length === 0) {
    throw new Error("Open-Meteo returned no hourly precipitation data");
  }
  const mm3h = readings.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);

  return { source: "open_meteo", quality: "ok", mm3h };
}
