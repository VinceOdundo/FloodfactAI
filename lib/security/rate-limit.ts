import "server-only";

/**
 * In-memory sliding-window limiter for the public report-intake route.
 * Sufficient for a single-instance pilot deployment; a multi-instance
 * production deployment should back this with a Postgres table (or Redis)
 * instead, since each serverless instance keeps its own map. WhatsApp/SMS
 * intake do not need this — abuse there is already bounded by the
 * messaging provider's own account limits.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    const retryAfterMs = WINDOW_MS - (now - recent[0]);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true };
}
