import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { HistoricalBaseRateEvidence } from "@/lib/core/types";

const SEVERITY_WEIGHT: Record<string, number> = {
  minor: 0.5,
  moderate: 1,
  severe: 1.5,
  catastrophic: 2,
};

/** A simple, transparent base rate from our own recorded incidents — not a claim of statistical rigor, just a real, growing signal. */
export async function getHistoricalBaseRate(pilotAreaId: string | null): Promise<HistoricalBaseRateEvidence> {
  if (!pilotAreaId) {
    return { source: "historical_base_rate", quality: "unavailable", baseRate: null };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("historical_flood_events")
    .select("severity")
    .eq("pilot_area_id", pilotAreaId);

  if (error || !data || data.length === 0) {
    return { source: "historical_base_rate", quality: "unavailable", baseRate: null };
  }

  const weighted = data.reduce((sum, row) => sum + (SEVERITY_WEIGHT[row.severity ?? "moderate"] ?? 1), 0);
  return { source: "historical_base_rate", quality: "ok", baseRate: Math.min(1, weighted * 0.3) };
}
