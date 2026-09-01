"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ROLE_COOKIE } from "@/lib/auth/session";

export async function signInWithPassword(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  redirect("/admin");
}

export async function signOut() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_ROLE_COOKIE);
    redirect("/login");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** DEMO_MODE only — lets a viewer switch roles with no real credentials. */
export async function setDemoRole(role: "admin" | "ambassador") {
  if (!isDemoMode()) return;
  const cookieStore = await cookies();
  cookieStore.set(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(role === "admin" ? "/admin" : "/ambassador");
}
