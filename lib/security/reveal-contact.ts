import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type RevealContactResult = { phones: string[] } | { error: string };

/**
 * The only path in the codebase that can read a real phone number back out
 * of `contact_channels`. Confirms admin status from the caller's own
 * RLS-respecting session (never trusts a client-supplied role flag), then
 * uses the service role — which is the only role with any read policy on
 * that table at all — and writes an audit event before returning.
 *
 * The audit payload stores a salted hash of the revealed number(s), not the
 * numbers themselves: enough to later confirm or deny "was this specific
 * number revealed" during an investigation, without the audit log becoming
 * a second copy of the contact list.
 */
export async function revealContactForReport(reportId: string): Promise<RevealContactResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleRow?.role !== "admin") return { error: "Forbidden" };

  const service = createServiceClient();
  const { data, error } = await service
    .from("contact_channels")
    .select("phone_e164")
    .eq("report_id", reportId);
  if (error) return { error: error.message };

  const phones = (data ?? []).map((r) => r.phone_e164 as string);

  await service.from("audit_events").insert({
    actor_type: "user",
    actor_id: user.id,
    action: "reveal_contact",
    entity_type: "report",
    entity_id: reportId,
    payload: { salted_hash: saltedHash(phones.join(",")) },
  });

  return { phones };
}

function saltedHash(value: string): string {
  return createHmac("sha256", env.ADMIN_REVEAL_AUDIT_SALT).update(value).digest("hex");
}
