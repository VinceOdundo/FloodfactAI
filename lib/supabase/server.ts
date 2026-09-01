import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";

/**
 * Session-aware client for Server Components / Server Actions — respects
 * RLS as the signed-in user (admin or ambassador). Never use this for
 * webhook/cron code paths that have no user session; use
 * lib/supabase/service.ts there instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — proxy.ts refreshes the
          // session on the next request instead. Safe to ignore here.
        }
      },
    },
  });
}
