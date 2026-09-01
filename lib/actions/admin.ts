"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { revealContactForReport } from "@/lib/security/reveal-contact";

export async function resolveEscalation(_prevState: { error: string | null; ok: boolean }, formData: FormData) {
  const escalationId = String(formData.get("escalationId") ?? "");
  const resolutionNotes = String(formData.get("resolutionNotes") ?? "").slice(0, 1000);
  if (!escalationId || !resolutionNotes.trim()) {
    return { error: "A resolution note is required.", ok: false };
  }

  if (isDemoMode()) {
    return { error: null, ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("escalations")
    .update({ status: "resolved", resolution_notes: resolutionNotes, resolved_at: new Date().toISOString() })
    .eq("id", escalationId);
  if (error) return { error: error.message, ok: false };

  revalidatePath("/admin/escalations");
  return { error: null, ok: true };
}

export async function revealContact(reportId: string): Promise<{ phones: string[] } | { error: string }> {
  if (isDemoMode()) {
    return { phones: ["+254 7XX XXX XXX (demo — no real contact stored)"] };
  }
  return revealContactForReport(reportId);
}
