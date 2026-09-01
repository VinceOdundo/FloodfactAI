import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";

export type DataSource =
  | "open_meteo"
  | "arcgis_flood_risk"
  | "river_level"
  | "llm_anthropic"
  | "embeddings_voyage"
  | "whatsapp"
  | "sms_africastalking";

export type ProviderModeLabel = "live" | "sandbox";

/** Updates the ops dashboard's data-source health panel. A no-op in demo mode (no real table to write to). */
export async function recordSourceHealth(
  source: DataSource,
  mode: ProviderModeLabel,
  outcome: { ok: true } | { ok: false; error: unknown }
): Promise<void> {
  if (isDemoMode()) return;

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const patch = outcome.ok
    ? { mode, status: "ok" as const, last_success_at: now }
    : { mode, status: "down" as const, last_error_at: now, last_error: describeError(outcome.error) };

  const { error } = await supabase.from("data_source_health").update(patch).eq("source", source);
  if (error) {
    console.error(`Failed to record source health for ${source}:`, error.message);
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
