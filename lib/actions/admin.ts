"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revealContactForReport } from "@/lib/security/reveal-contact";
import { hashPhoneNumber } from "@/lib/security/hashing";
import { getSession } from "@/lib/auth/session";

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

const createAmbassadorSchema = z.object({
  fullName: z.string().min(2).max(200),
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +254712345678"),
  // z.guid(), not z.string().uuid() — see lib/actions/ambassador.ts for why.
  pilotAreaId: z.guid(),
});

function generateTempPassword(): string {
  return randomBytes(24).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}

export type CreateAmbassadorState = { error: string | null; ok: boolean; tempPassword?: string; email?: string };

/**
 * Onboards a new ambassador: creates their Supabase Auth login (temporary
 * password, shown once), their `ambassadors` row, and their `user_roles`
 * row — the only way to add one before this was direct DB access via
 * supabase/seed.sql. Admin-only; the service role bypasses RLS so the
 * authorization check happens here, not at the database layer.
 */
export async function createAmbassador(
  _prevState: CreateAmbassadorState,
  formData: FormData
): Promise<CreateAmbassadorState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Not authorized", ok: false };
  }

  const parsed = createAmbassadorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission", ok: false };
  }
  const { fullName, phoneE164, pilotAreaId } = parsed.data;

  if (isDemoMode()) {
    return { error: null, ok: true, tempPassword: "demo-mode-not-a-real-password", email: "demo@example.com" };
  }

  const service = createServiceClient();
  // No email is collected from residents/ambassadors in this pilot — synthesize
  // a stable, non-guessable placeholder so Supabase Auth has a unique identity;
  // sign-in for staff accounts is by email+password, set by whoever provisions them.
  const email = `ambassador+${phoneE164.replace(/[^0-9]/g, "")}@floodfact.local`;
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: createError?.message ?? "Failed to create login", ok: false };
  }

  const { error: ambassadorError } = await service.from("ambassadors").insert({
    user_id: created.user.id,
    full_name: fullName,
    pilot_area_id: pilotAreaId,
    phone_hash: hashPhoneNumber(phoneE164),
  });
  if (ambassadorError) {
    await service.auth.admin.deleteUser(created.user.id);
    return { error: ambassadorError.message, ok: false };
  }

  const { error: roleError } = await service.from("user_roles").insert({
    user_id: created.user.id,
    role: "ambassador",
  });
  if (roleError) {
    // `ambassadors.user_id` is ON DELETE SET NULL, not CASCADE — delete the
    // row explicitly so a role-insert failure doesn't leave an orphaned,
    // login-less ambassador profile behind.
    await service.from("ambassadors").delete().eq("user_id", created.user.id);
    await service.auth.admin.deleteUser(created.user.id);
    return { error: roleError.message, ok: false };
  }

  revalidatePath("/admin/ambassadors");
  return { error: null, ok: true, tempPassword, email };
}
