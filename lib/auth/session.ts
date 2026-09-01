import "server-only";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

export interface Session {
  role: "admin" | "ambassador";
  userId: string;
  displayName: string;
  pilotAreaId?: string;
  pilotAreaName?: string;
}

const DEMO_ROLE_COOKIE = "ff_demo_role";

/**
 * Single source of truth for "who is viewing" across both real Supabase
 * Auth and DEMO_MODE. In demo mode, a cookie (set by the demo login page)
 * lets a viewer switch between the admin and ambassador experience without
 * any real credentials.
 */
export async function getSession(): Promise<Session | null> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
    if (demoRole === "ambassador") {
      return {
        role: "ambassador",
        userId: "demo-ambassador",
        displayName: "Faith Wanjiru (demo)",
        pilotAreaId: "10000000-0000-0000-0000-000000000001",
        pilotAreaName: "Mukuru kwa Reuben",
      };
    }
    if (demoRole === "admin") {
      return { role: "admin", userId: "demo-admin", displayName: "Ops Admin (demo)" };
    }
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!roleRow) return null;

  if (roleRow.role === "ambassador") {
    const { data: ambassador } = await supabase
      .from("ambassadors")
      .select("full_name, pilot_area_id, pilot_areas(name)")
      .eq("user_id", user.id)
      .maybeSingle();
    return {
      role: "ambassador",
      userId: user.id,
      displayName: ambassador?.full_name ?? user.email ?? "Ambassador",
      pilotAreaId: ambassador?.pilot_area_id ?? undefined,
      pilotAreaName: (ambassador?.pilot_areas as unknown as { name: string } | null)?.name,
    };
  }

  return { role: "admin", userId: user.id, displayName: user.email ?? "Admin" };
}

export { DEMO_ROLE_COOKIE };
