import "server-only";
import { scoreReport } from "@/lib/core/risk-engine";
import type { EvidenceItem, HazardType } from "@/lib/core/types";
import { isDemoMode, providerMode } from "@/lib/config/env";
import {
  countRecentCorroborations,
  createEscalation,
  getReportById,
  getReporterContact,
  saveClassification,
  saveEvidenceItems,
  saveNluExtraction,
  updateReportLanguage,
  updateReportPilotArea,
  updateReportStatus,
} from "@/lib/data/reports";
import { getPilotAreaById, resolvePilotArea } from "@/lib/data/pilot-areas";
import { getHistoricalBaseRate } from "@/lib/data/historical";
import { getAmbassadorGroundTruth } from "@/lib/data/ambassadors";
import { matchRumorPattern } from "@/lib/data/rumor-patterns";
import { dispatchAlert, sendUnderReviewAcknowledgement } from "@/lib/data/alerts";
import { resolveMessageLanguage } from "@/lib/core/alert-templates";
import { writeAuditEvent } from "@/lib/data/audit";
import { getRainfallEvidence } from "@/lib/providers/weather-openmeteo";
import { getFloodRiskEvidence } from "@/lib/providers/flood-risk-arcgis";
import { getRiverLevelEvidence } from "@/lib/providers/river-level";
import { extractMessage, generateRationale } from "@/lib/providers/llm-anthropic";

/**
 * The full report -> evidence -> classification -> alert pipeline described
 * in docs/ARCHITECTURE.md. Called from the public report-intake route and
 * both messaging webhooks, always with the same report id shape, so every
 * channel goes through identical evidence-gathering and the identical
 * (deterministic, tested) decision core.
 */
export async function runClassificationPipeline(reportId: string): Promise<void> {
  if (isDemoMode()) {
    // No real report was written (see the matching guard in
    // lib/data/reports.ts createReport) — nothing to classify.
    return;
  }

  const report = await getReportById(reportId);
  if (!report) throw new Error(`Report ${reportId} not found`);

  await updateReportStatus(reportId, "processing");

  const extraction = await extractMessage(report.raw_text);
  await saveNluExtraction(reportId, {
    providerMode: providerMode.llm(),
    model: extraction.model,
    extractedJson: extraction.raw,
    keyClaims: extraction.keyClaims,
    hazardTypeGuess: extraction.hazardTypeGuess,
    claimedLocationText: extraction.claimedLocationText,
    language: extraction.language,
    urgencySignal: extraction.urgencySignal,
  });

  await updateReportLanguage(reportId, extraction.language);
  const language = resolveMessageLanguage(extraction.language);

  const hazardType: HazardType = (report.hazard_type as HazardType) ?? extraction.hazardTypeGuess;

  let pilotAreaId = report.pilot_area_id;
  if (!pilotAreaId) {
    const area = await resolvePilotArea({
      freeText: [report.claimed_location_text, extraction.claimedLocationText, report.raw_text]
        .filter(Boolean)
        .join(" "),
    });
    if (area) {
      pilotAreaId = area.id;
      await updateReportPilotArea(reportId, area.id);
    }
  }
  const pilotArea = pilotAreaId ? await getPilotAreaById(pilotAreaId) : null;
  const point = pilotArea?.centroid ?? null;

  const [rainfall, riskZone, historical, ambassador, rumor] = await Promise.all([
    point
      ? getRainfallEvidence(point)
      : Promise.resolve<EvidenceItem>({ source: "open_meteo", quality: "unavailable", mm3h: null }),
    point
      ? getFloodRiskEvidence(point)
      : Promise.resolve<EvidenceItem>({ source: "arcgis_flood_risk", quality: "unavailable", inRiskZone: null, riskLevel: null }),
    getHistoricalBaseRate(pilotAreaId),
    getAmbassadorGroundTruth(reportId, pilotAreaId),
    matchRumorPattern(report.raw_text),
  ]);

  // No live river-gauge source exists yet (see lib/providers/river-level) —
  // still attempted so its data-source-health status stays accurate.
  if (point) await getRiverLevelEvidence(point);

  const corroborationCount = pilotAreaId ? await countRecentCorroborations(pilotAreaId, reportId) : null;
  const corroboration: EvidenceItem = {
    source: "corroboration",
    quality: corroborationCount === null ? "unavailable" : "ok",
    recentReportCount: corroborationCount,
  };

  const evidence: EvidenceItem[] = [rainfall, riskZone, historical, corroboration, ambassador, rumor];
  await saveEvidenceItems(reportId, evidence);

  const output = scoreReport({ hazardType, evidence });

  const rationale = await generateRationale({
    classification: output.classification,
    confidence: output.confidence,
    evidenceRationale: output.rationale,
    pilotAreaName: pilotArea?.name ?? "the reported area",
  });

  const classificationId = await saveClassification({
    reportId,
    output,
    rationaleEn: rationale.en,
    rationaleSw: rationale.sw,
    llmModel: extraction.model,
    llmProviderMode: providerMode.llm(),
  });

  await writeAuditEvent({
    actorType: "system",
    actorId: "classify-pipeline",
    action: "classification_decided",
    entityType: "report",
    entityId: reportId,
    payload: {
      classification: output.classification,
      confidence: output.confidence,
      insufficientEvidence: output.insufficientEvidence,
      conflictingEvidence: output.conflictingEvidence,
    },
  });

  if (output.insufficientEvidence || output.conflictingEvidence) {
    await createEscalation(reportId, classificationId, output.rationale.join(" "));
    await updateReportStatus(reportId, "escalated");

    // No verdict alert goes out here — that's the whole point of escalating.
    // But the reporter still gets told a human has it, rather than silence
    // while the case sits open.
    const escalatedContact = await getReporterContact(reportId);
    const ack = await sendUnderReviewAcknowledgement({
      pilotAreaName: pilotArea?.name ?? "your area",
      locationDetail: report.claimed_location_text,
      reporterChannel: escalatedContact?.channel ?? null,
      reporterPhoneE164: escalatedContact?.phone ?? null,
      language,
    });

    await writeAuditEvent({
      actorType: "system",
      actorId: "classify-pipeline",
      action: "under_review_acknowledgement",
      entityType: "report",
      entityId: reportId,
      payload: {
        // No contact channel captured — nobody to acknowledge to.
        sent: ack !== null && ack.status === "sent",
        channel: escalatedContact?.channel ?? null,
        language,
        error: ack?.error ?? null,
      },
    });
    return;
  }

  await updateReportStatus(reportId, "classified");

  const reporterContact = await getReporterContact(reportId);
  await dispatchAlert({
    language,
    reportId,
    classificationId,
    classification: output.classification,
    pilotAreaId,
    pilotAreaName: pilotArea?.name ?? "your area",
    locationDetail: report.claimed_location_text,
    topRationale: output.rationale,
    reporterChannel: reporterContact?.channel ?? null,
    reporterPhoneE164: reporterContact?.phone ?? null,
  });

  await writeAuditEvent({
    actorType: "system",
    actorId: "classify-pipeline",
    action: "alert_dispatched",
    entityType: "report",
    entityId: reportId,
  });
}
