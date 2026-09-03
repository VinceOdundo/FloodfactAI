"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

const schema = z.object({
  // z.guid(), not z.string().uuid(): the latter enforces RFC 4122 v4
  // version/variant bits, which this project's seed/demo placeholder ids
  // (e.g. "30000000-0000-0000-0000-000000000001") don't satisfy even though
  // they're valid Postgres `uuid` values — z.guid() matches what Postgres
  // itself accepts.
  reportId: z.guid().optional().or(z.literal("")),
  observationType: z.enum(["water_level", "visual_confirmation", "household_reached", "other"]),
  measurement: z.coerce.number().optional(),
  confirmed: z.enum(["true", "false"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function submitObservation(_prevState: { error: string | null; ok: boolean }, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ambassador" || !session.pilotAreaId) {
    return { error: "Not authorized", ok: false };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Invalid submission", ok: false };
  }

  if (isDemoMode()) {
    // Nothing to persist without a database — the demo still confirms the action.
    return { error: null, ok: true };
  }

  const supabase = await createClient();
  const { data: ambassador } = await supabase
    .from("ambassadors")
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!ambassador) return { error: "No ambassador profile found for this account", ok: false };

  const { error } = await supabase.from("ambassador_observations").insert({
    ambassador_id: ambassador.id,
    report_id: parsed.data.reportId || null,
    pilot_area_id: session.pilotAreaId,
    observation_type: parsed.data.observationType,
    measurement: parsed.data.measurement ?? null,
    confirmed: parsed.data.confirmed ? parsed.data.confirmed === "true" : null,
    notes: parsed.data.notes ?? null,
  });

  if (error) return { error: error.message, ok: false };

  revalidatePath("/ambassador");
  return { error: null, ok: true };
}
