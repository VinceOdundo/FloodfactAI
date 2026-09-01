import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

/**
 * Service-role client: bypasses RLS entirely. Only for trusted backend code
 * with no end-user session — webhook handlers, cron ingestion, the classify
 * pipeline. Never import this into anything reachable from a client bundle.
 */
export function createServiceClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "createServiceClient() called without Supabase configured — guard call sites with isDemoMode()."
    );
  }
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
