import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { FIXTURE_REPORTS } from "@/lib/data/fixtures";
import type { ClassificationLabel } from "./admin";

export interface CaseDetail {
  id: string;
  rawText: string;
  claimedLocationText: string | null;
  hazardType: string;
  status: string;
  createdAt: string;
  classification: { classification: ClassificationLabel; confidence: number; rationaleEn: string } | null;
}

export async function getCaseDetail(id: string): Promise<CaseDetail | null> {
  if (isDemoMode()) {
    const fixture = FIXTURE_REPORTS.find((r) => r.id === id);
    if (!fixture) return null;
    return {
      id: fixture.id,
      rawText: fixture.rawText,
      claimedLocationText: fixture.pilotAreaName,
      hazardType: fixture.hazardType,
      status: fixture.status,
      createdAt: fixture.createdAt,
      classification: fixture.classification
        ? { classification: fixture.classification.classification, confidence: fixture.classification.confidence, rationaleEn: fixture.classification.rationaleEn }
        : null,
    };
  }
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("reports")
    .select("id, raw_text, claimed_location_text, hazard_type, status, created_at, classifications(classification, confidence, rationale_en, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  const classifications = (r.classifications as unknown as Array<{ classification: ClassificationLabel; confidence: number; rationale_en: string; created_at: string }>) ?? [];
  const latest = [...classifications].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  return {
    id: r.id,
    rawText: r.raw_text,
    claimedLocationText: r.claimed_location_text,
    hazardType: r.hazard_type,
    status: r.status,
    createdAt: r.created_at,
    classification: latest ? { classification: latest.classification, confidence: latest.confidence, rationaleEn: latest.rationale_en } : null,
  };
}

export interface AmbassadorQueueItem {
  id: string;
  rawText: string;
  hazardType: string;
  status: string;
  createdAt: string;
  classification: {
    classification: ClassificationLabel;
    confidence: number;
  } | null;
}

/** RLS (reports_ambassador_scoped) already limits this to the caller's own pilot area — no extra filtering needed. */
export async function getAmbassadorQueue(): Promise<AmbassadorQueueItem[]> {
  if (isDemoMode()) {
    return FIXTURE_REPORTS.filter((r) => r.pilotAreaId === "10000000-0000-0000-0000-000000000001").map((r) => ({
      id: r.id,
      rawText: r.rawText,
      hazardType: r.hazardType,
      status: r.status,
      createdAt: r.createdAt,
      classification: r.classification ? { classification: r.classification.classification, confidence: r.classification.confidence } : null,
    }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, raw_text, hazard_type, status, created_at, classifications(classification, confidence, created_at)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((r) => {
    const classifications =
      (r.classifications as unknown as Array<{ classification: ClassificationLabel; confidence: number; created_at: string }>) ?? [];
    const latest = [...classifications].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    return {
      id: r.id,
      rawText: r.raw_text,
      hazardType: r.hazard_type,
      status: r.status,
      createdAt: r.created_at,
      classification: latest ? { classification: latest.classification, confidence: latest.confidence } : null,
    };
  });
}
