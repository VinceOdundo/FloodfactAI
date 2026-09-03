import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

// In-memory fallback — used only when there's no real database (DEMO_MODE /
// no Supabase configured, including this module's own unit tests). A
// single-instance approximation only; never relied on when live.
const hits = new Map<string, number[]>();

function checkRateLimitInMemory(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - recent[0]) };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true };
}

/**
 * Sliding-window limiter for the public report-intake route. Backed by the
 * `rate_limit_hits` Postgres table so the count is correct across any
 * number of serverless instances; falls back to an in-memory map only when
 * there's no real database configured. WhatsApp/SMS intake do not call
 * this — abuse there is already bounded by the messaging provider's own
 * account limits.
 */
export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  if (isDemoMode()) return checkRateLimitInMemory(key);

  const supabase = createServiceClient();
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  // Prune this key's expired hits before counting — keeps the table bounded
  // without a separate cleanup job.
  await supabase.from("rate_limit_hits").delete().eq("key", key).lt("created_at", windowStart);

  const { data: recent, error } = await supabase
    .from("rate_limit_hits")
    .select("created_at")
    .eq("key", key)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Rate limit check failed, failing open:", error.message);
    return { allowed: true };
  }

  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = new Date(recent[0].created_at).getTime();
    return { allowed: false, retryAfterMs: WINDOW_MS - (Date.now() - oldest) };
  }

  await supabase.from("rate_limit_hits").insert({ key });
  return { allowed: true };
}
