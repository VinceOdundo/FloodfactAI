import "server-only";

/**
 * Every sandbox provider returns quality "degraded" rather than "ok" — it is
 * a real, exercised code path standing in for a real source, not a
 * confidently-clean reading. This is honest (never silently presented as
 * live data — see NFR-06 in docs/) and it composes correctly with
 * lib/core/risk-engine.ts: degrading every signal uniformly does not bias a
 * fully-sandboxed run, since a weighted average is unaffected by scaling
 * every weight by the same factor — it only matters when sandbox and live
 * signals are mixed, which is exactly when it should matter.
 */
export const SANDBOX_QUALITY = "degraded" as const;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Deterministic pseudo-random in [0, 1), seeded by a string — stable demo data, no external RNG dependency. */
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Buckets a point + time into a coarse, stable seed so repeated calls within the same hour look consistent. */
export function hourBucketSeed(point: GeoPoint, extra = ""): string {
  const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
  return `${point.lat.toFixed(3)}:${point.lon.toFixed(3)}:${hourBucket}:${extra}`;
}
