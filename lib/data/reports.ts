import "server-only";
import { randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";
import { hashPhoneNumber } from "@/lib/security/hashing";
import type { EvidenceItem, HazardType, RiskEngineOutput } from "@/lib/core/types";
import type { GeoPoint } from "@/lib/providers/shared";

export interface CreateReportInput {
  sourceChannel: "whatsapp" | "sms" | "web" | "ambassador";
  rawText: string;
  phoneE164?: string | null;
  claimedLocationText?: string | null;
  point?: GeoPoint | null;
  pilotAreaId?: string | null;
  hazardType?: HazardType;
  mediaUrls?: string[];
}

export interface ReportRow {
  id: string;
  source_channel: string;
  raw_text: string;
  claimed_location_text: string | null;
  pilot_area_id: string | null;
  hazard_type: HazardType;
  status: string;
  created_at: string;
}

export async function createReport(input: CreateReportInput): Promise<string> {
  if (isDemoMode()) {
    // No real database to write to — the public form still confirms
    // submission (see app/(marketing)/report/report-form.tsx), but nothing
    // is persisted and the pipeline is never invoked (see the matching
    // isDemoMode() guard in lib/pipeline/classify.ts).
    return `demo-${randomUUID()}`;
  }

  const supabase = createServiceClient();

  const reporterRef = input.phoneE164
    ? hashPhoneNumber(input.phoneE164)
    : hashPhoneNumber(`anon:${input.sourceChannel}:${Date.now()}:${Math.random()}`);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      source_channel: input.sourceChannel,
      raw_text: input.rawText,
      media_urls: input.mediaUrls ?? [],
      reporter_ref: reporterRef,
      claimed_location_text: input.claimedLocationText ?? null,
      geocoded_point: input.point ? `POINT(${input.point.lon} ${input.point.lat})` : null,
      pilot_area_id: input.pilotAreaId ?? null,
      hazard_type: input.hazardType ?? "flood",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create report: ${error?.message}`);
  }

  if (input.phoneE164) {
    const channel = input.sourceChannel === "sms" ? "sms" : "whatsapp";
    await supabase.from("contact_channels").insert({ report_id: data.id, channel, phone_e164: input.phoneE164 });
  }

  return data.id;
}

export async function getReportById(id: string): Promise<ReportRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, source_channel, raw_text, claimed_location_text, pilot_area_id, hazard_type, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ReportRow;
}

export async function updateReportPilotArea(reportId: string, pilotAreaId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("reports").update({ pilot_area_id: pilotAreaId }).eq("id", reportId);
}

export async function updateReportStatus(
  reportId: string,
  status: "pending" | "processing" | "classified" | "escalated" | "resolved" | "failed"
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("reports").update({ status }).eq("id", reportId);
}

export async function saveNluExtraction(
  reportId: string,
  extraction: { providerMode: "live" | "sandbox"; model: string; extractedJson: unknown; keyClaims: string[]; hazardTypeGuess: string; claimedLocationText: string | null; language: string | null; urgencySignal: string }
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("nlu_extractions").insert({
    report_id: reportId,
    provider_mode: extraction.providerMode,
    model: extraction.model,
    extracted_json: extraction.extractedJson as object,
    key_claims: extraction.keyClaims,
    hazard_type_guess: extraction.hazardTypeGuess,
    claimed_location_text: extraction.claimedLocationText,
    language: extraction.language,
    urgency_signal: extraction.urgencySignal,
  });
}

export async function saveEvidenceItems(reportId: string, items: EvidenceItem[]): Promise<void> {
  const supabase = createServiceClient();
  const rows = items.map((item) => ({
    report_id: reportId,
    source: item.source,
    observation: item as unknown as object,
    numeric_value: extractNumericValue(item),
    quality: item.quality,
    fetched_at: new Date().toISOString(),
  }));
  await supabase.from("evidence_items").insert(rows);
}

function extractNumericValue(item: EvidenceItem): number | null {
  switch (item.source) {
    case "open_meteo":
      return item.mm3h;
    case "arcgis_flood_risk":
      return item.inRiskZone === null ? null : item.inRiskZone ? 1 : 0;
    case "historical_base_rate":
      return item.baseRate;
    case "corroboration":
      return item.recentReportCount;
    case "ambassador_ground_truth":
      return item.waterLevelCm;
    case "rumor_pattern_similarity":
      return item.maxSimilarity;
  }
}

export interface SaveClassificationInput {
  reportId: string;
  output: RiskEngineOutput;
  rationaleEn: string;
  rationaleSw: string;
  llmModel: string;
  llmProviderMode: "live" | "sandbox";
}

export async function saveClassification(input: SaveClassificationInput): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("classifications")
    .insert({
      report_id: input.reportId,
      classification: input.output.classification,
      confidence: input.output.confidence,
      insufficient_evidence: input.output.insufficientEvidence,
      rationale_en: input.rationaleEn,
      rationale_sw: input.rationaleSw,
      evidence_snapshot: input.output as unknown as object,
      engine_version: input.output.engineVersion,
      llm_model: input.llmModel,
      llm_provider_mode: input.llmProviderMode,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to save classification: ${error?.message}`);
  }
  return data.id;
}

export async function createEscalation(reportId: string, classificationId: string | null, reason: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("escalations").insert({ report_id: reportId, classification_id: classificationId, reason });
}

export async function getReporterContact(
  reportId: string
): Promise<{ channel: "whatsapp" | "sms"; phone: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("contact_channels")
    .select("channel, phone_e164")
    .eq("report_id", reportId)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { channel: data.channel as "whatsapp" | "sms", phone: data.phone_e164 as string };
}

export async function countRecentCorroborations(pilotAreaId: string, excludeReportId: string): Promise<number | null> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("count_recent_corroborations", {
    p_pilot_area_id: pilotAreaId,
    p_since: since,
    p_exclude_report_id: excludeReportId,
  });
  if (error) return null;
  return data as number;
}
