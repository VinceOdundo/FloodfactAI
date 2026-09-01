import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for Client Components. Reads NEXT_PUBLIC_* directly
 * (never lib/config/env.ts, which is server-only and would break the
 * client bundle). Respects RLS as the signed-in user, same as the server
 * client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
