import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/env";
import { getRainfallEvidence } from "@/lib/providers/weather-openmeteo";
import { getFloodRiskEvidence } from "@/lib/providers/flood-risk-arcgis";
import { getRiverLevelEvidence } from "@/lib/providers/river-level";
import { createServiceClient } from "@/lib/supabase/service";
import { isEscalationBreached } from "@/lib/core/escalation-sla";
import { writeAuditEvent } from "@/lib/data/audit";

/**
 * Internal ops action endpoint for the admin dashboard.
 * Requires an active admin session (session cookie), not a cron secret.
 *
 * POST /api/ops/trigger?action=health-check
 * POST /api/ops/trigger?action=escalation-sweep
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "health-check") {
    if (isDemoMode()) {
      // Return simulated probe results in demo mode
      return NextResponse.json({
        ok: true,
        checkedAt: new Date().toISOString(),
        results: {
          open_meteo: "ok",
          arcgis_flood_risk: "ok",
          river_level: "down",
          llm_anthropic: "ok",
          embeddings_voyage: "ok",
          whatsapp: "ok",
          sms_africastalking: "ok",
        },
        note: "demo mode — sandbox probes simulated",
      });
    }

    const TEST_POINT = { lat: -1.3152004, lon: 36.8820407 };
    const [rainfall, riskZone, river] = await Promise.allSettled([
      getRainfallEvidence(TEST_POINT),
      getFloodRiskEvidence(TEST_POINT),
      getRiverLevelEvidence(TEST_POINT),
    ]);

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      results: {
        open_meteo: rainfall.status === "fulfilled" ? rainfall.value.quality : "error",
        arcgis_flood_risk: riskZone.status === "fulfilled" ? riskZone.value.quality : "error",
        river_level: river.status === "fulfilled" ? river.value.quality : "error",
      },
    });
  }

  if (action === "escalation-sweep") {
    if (isDemoMode()) {
      return NextResponse.json({
        ok: true,
        checkedAt: new Date().toISOString(),
        openTotal: 1,
        breachedTotal: 0,
        newlyFlagged: 0,
        note: "demo mode — no-op",
      });
    }

    const supabase = createServiceClient();
    const { data: openEscalations, error } = await supabase
      .from("escalations")
      .select("id, created_at")
      .neq("status", "resolved");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
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
        actorId: "admin-dashboard-trigger",
        action: "escalation_sla_breached",
        entityType: "escalation",
        entityId: escalation.id,
        payload: { createdAt: escalation.created_at },
      });
      newlyFlagged++;
    }

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      openTotal: openEscalations?.length ?? 0,
      breachedTotal: breached.length,
      newlyFlagged,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
