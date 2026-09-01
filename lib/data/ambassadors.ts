import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AmbassadorGroundTruthEvidence } from "@/lib/core/types";

const GROUND_TRUTH_WINDOW_HOURS = 3;

/**
 * A ground-truth check tied to THIS report is treated as "ok" quality; an
 * unrelated but recent area-wide check-in is still real evidence, just
 * "degraded" (less specific to this exact report).
 */
export async function getAmbassadorGroundTruth(
  reportId: string,
  pilotAreaId: string | null
): Promise<AmbassadorGroundTruthEvidence> {
  if (!pilotAreaId) {
    return { source: "ambassador_ground_truth", quality: "unavailable", waterLevelCm: null, visuallyConfirmed: null };
  }

  const supabase = createServiceClient();

  const { data: linked } = await supabase
    .from("ambassador_observations")
    .select("observation_type, measurement, confirmed")
    .eq("report_id", reportId)
    .in("observation_type", ["water_level", "visual_confirmation"])
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linked) {
    return toEvidence(linked, "ok");
  }

  const since = new Date(Date.now() - GROUND_TRUTH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: nearby } = await supabase
    .from("ambassador_observations")
    .select("observation_type, measurement, confirmed")
    .eq("pilot_area_id", pilotAreaId)
    .in("observation_type", ["water_level", "visual_confirmation"])
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (nearby) {
    return toEvidence(nearby, "degraded");
  }

  return { source: "ambassador_ground_truth", quality: "unavailable", waterLevelCm: null, visuallyConfirmed: null };
}

function toEvidence(
  row: { observation_type: string; measurement: number | null; confirmed: boolean | null },
  quality: "ok" | "degraded"
): AmbassadorGroundTruthEvidence {
  return {
    source: "ambassador_ground_truth",
    quality,
    waterLevelCm: row.observation_type === "water_level" ? row.measurement : null,
    visuallyConfirmed: row.observation_type === "visual_confirmation" ? row.confirmed : null,
  };
}
