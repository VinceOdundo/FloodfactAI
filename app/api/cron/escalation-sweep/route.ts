import { NextResponse } from "next/server";
import { env, isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";
import { isEscalationBreached } from "@/lib/core/escalation-sla";
import { writeAuditEvent } from "@/lib/data/audit";

/**
 * Invoked on a schedule (see .github/workflows/escalation-sweep.yml). There is
 * no outbound notification channel for staleness today (no email/SMS-to-admin
 * integration exists) — this only makes a breach visible: once, in the audit
 * trail, so it's queryable/reportable without spamming a row every run. The
 * age badge on /admin/escalations is the live-visibility half of this.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ checkedAt: new Date().toISOString(), breached: 0, note: "demo mode — no-op" });
  }

  const supabase = createServiceClient();
  const { data: openEscalations, error } = await supabase
    .from("escalations")
    .select("id, created_at")
    .neq("status", "resolved");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const breached = (openEscalations ?? []).filter((e) => isEscalationBreached(e.created_at));
  let newlyFlagged = 0;

  for (const escalation of breached) {
    const { data: existing } = await supabase
      .from("audit_events")
      .select("id")
      .eq("entity_type", "escalation")
      .eq("entity_id", escalation.id)
      .eq("action", "escalation_sla_breached")
      .limit(1);
    if (existing && existing.length > 0) continue;

    await writeAuditEvent({
      actorType: "system",
      actorId: "escalation-sweep-cron",
      action: "escalation_sla_breached",
      entityType: "escalation",
      entityId: escalation.id,
      payload: { createdAt: escalation.created_at },
    });
    newlyFlagged++;
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    openTotal: openEscalations?.length ?? 0,
    breachedTotal: breached.length,
    newlyFlagged,
  });
}
