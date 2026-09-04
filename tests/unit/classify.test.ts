import { beforeEach, describe, expect, it, vi } from "vitest";
import { runClassificationPipeline } from "@/lib/pipeline/classify";

vi.mock("@/lib/config/env", () => ({
  isDemoMode: () => false,
  providerMode: { llm: () => "sandbox" },
}));

const mocks = vi.hoisted(() => ({
  getReportById: vi.fn(),
  updateReportStatus: vi.fn(),
  saveNluExtraction: vi.fn(),
  updateReportLanguage: vi.fn(),
  updateReportPilotArea: vi.fn(),
  saveEvidenceItems: vi.fn(),
  saveClassification: vi.fn(),
  createEscalation: vi.fn(),
  getReporterContact: vi.fn(),
  countRecentCorroborations: vi.fn(),
  getPilotAreaById: vi.fn(),
  resolvePilotArea: vi.fn(),
  getHistoricalBaseRate: vi.fn(),
  getAmbassadorGroundTruth: vi.fn(),
  matchRumorPattern: vi.fn(),
  dispatchAlert: vi.fn(),
  sendUnderReviewAcknowledgement: vi.fn(),
  writeAuditEvent: vi.fn(),
  getRainfallEvidence: vi.fn(),
  getFloodRiskEvidence: vi.fn(),
  getRiverLevelEvidence: vi.fn(),
  extractMessage: vi.fn(),
  generateRationale: vi.fn(),
}));

vi.mock("@/lib/data/reports", () => ({
  getReportById: mocks.getReportById,
  updateReportStatus: mocks.updateReportStatus,
  saveNluExtraction: mocks.saveNluExtraction,
  updateReportLanguage: mocks.updateReportLanguage,
  updateReportPilotArea: mocks.updateReportPilotArea,
  saveEvidenceItems: mocks.saveEvidenceItems,
  saveClassification: mocks.saveClassification,
  createEscalation: mocks.createEscalation,
  getReporterContact: mocks.getReporterContact,
  countRecentCorroborations: mocks.countRecentCorroborations,
}));
vi.mock("@/lib/data/pilot-areas", () => ({
  getPilotAreaById: mocks.getPilotAreaById,
  resolvePilotArea: mocks.resolvePilotArea,
}));
vi.mock("@/lib/data/historical", () => ({ getHistoricalBaseRate: mocks.getHistoricalBaseRate }));
vi.mock("@/lib/data/ambassadors", () => ({ getAmbassadorGroundTruth: mocks.getAmbassadorGroundTruth }));
vi.mock("@/lib/data/rumor-patterns", () => ({ matchRumorPattern: mocks.matchRumorPattern }));
vi.mock("@/lib/data/alerts", () => ({
  dispatchAlert: mocks.dispatchAlert,
  sendUnderReviewAcknowledgement: mocks.sendUnderReviewAcknowledgement,
}));
vi.mock("@/lib/data/audit", () => ({ writeAuditEvent: mocks.writeAuditEvent }));
vi.mock("@/lib/providers/weather-openmeteo", () => ({ getRainfallEvidence: mocks.getRainfallEvidence }));
vi.mock("@/lib/providers/flood-risk-arcgis", () => ({ getFloodRiskEvidence: mocks.getFloodRiskEvidence }));
vi.mock("@/lib/providers/river-level", () => ({ getRiverLevelEvidence: mocks.getRiverLevelEvidence }));
vi.mock("@/lib/providers/llm-anthropic", () => ({
  extractMessage: mocks.extractMessage,
  generateRationale: mocks.generateRationale,
}));

const REPORT_ID = "report-1";
const PILOT_AREA_ID = "pilot-area-1";

function baseReport() {
  return {
    id: REPORT_ID,
    raw_text: "Water rising fast near the bridge",
    hazard_type: "flood",
    pilot_area_id: PILOT_AREA_ID,
    claimed_location_text: "near the bridge",
  };
}

function unavailable(source: string) {
  return { source, quality: "unavailable" as const };
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getReportById.mockResolvedValue(baseReport());
  mocks.getPilotAreaById.mockResolvedValue({
    id: PILOT_AREA_ID,
    slug: "mukuru-kwa-reuben",
    name: "Mukuru kwa Reuben",
    centroid: { lat: -1.3152, lon: 36.882 },
  });
  mocks.extractMessage.mockResolvedValue({
    model: "sandbox-heuristic",
    raw: {},
    keyClaims: [],
    hazardTypeGuess: "flood",
    claimedLocationText: "near the bridge",
    language: "en",
    urgencySignal: "high",
  });
  mocks.generateRationale.mockResolvedValue({ en: "rationale", sw: null });
  mocks.countRecentCorroborations.mockResolvedValue(0);
  mocks.saveClassification.mockResolvedValue("classification-1");
  mocks.getReporterContact.mockResolvedValue(null);
  mocks.sendUnderReviewAcknowledgement.mockResolvedValue(null);
});

function allEvidenceUnavailable() {
  mocks.getRainfallEvidence.mockResolvedValue(unavailable("open_meteo"));
  mocks.getFloodRiskEvidence.mockResolvedValue(unavailable("arcgis_flood_risk"));
  mocks.getHistoricalBaseRate.mockResolvedValue(unavailable("historical_base_rate"));
  mocks.getAmbassadorGroundTruth.mockResolvedValue(unavailable("ambassador_ground_truth"));
  mocks.matchRumorPattern.mockResolvedValue(unavailable("rumor_pattern_similarity"));
  mocks.countRecentCorroborations.mockResolvedValue(null);
}

function strongFloodEvidence() {
  mocks.getRainfallEvidence.mockResolvedValue({ source: "open_meteo", quality: "ok", mm3h: 38.5 });
  mocks.getFloodRiskEvidence.mockResolvedValue({
    source: "arcgis_flood_risk",
    quality: "ok",
    inRiskZone: true,
    riskLevel: "high",
  });
  mocks.getHistoricalBaseRate.mockResolvedValue({ source: "historical_base_rate", quality: "ok", baseRate: 0.6 });
  mocks.getAmbassadorGroundTruth.mockResolvedValue(unavailable("ambassador_ground_truth"));
  mocks.matchRumorPattern.mockResolvedValue(unavailable("rumor_pattern_similarity"));
  mocks.countRecentCorroborations.mockResolvedValue(2);
}

describe("runClassificationPipeline — insufficient evidence", () => {
  it("escalates and stops without dispatching an alert when every source is unavailable", async () => {
    mocks.getRainfallEvidence.mockResolvedValue(unavailable("open_meteo"));
    mocks.getFloodRiskEvidence.mockResolvedValue(unavailable("arcgis_flood_risk"));
    mocks.getHistoricalBaseRate.mockResolvedValue(unavailable("historical_base_rate"));
    mocks.getAmbassadorGroundTruth.mockResolvedValue(unavailable("ambassador_ground_truth"));
    mocks.matchRumorPattern.mockResolvedValue(unavailable("rumor_pattern_similarity"));
    mocks.countRecentCorroborations.mockResolvedValue(null);

    await runClassificationPipeline(REPORT_ID);

    expect(mocks.createEscalation).toHaveBeenCalledTimes(1);
    expect(mocks.createEscalation.mock.calls[0][0]).toBe(REPORT_ID);
    expect(mocks.updateReportStatus).toHaveBeenCalledWith(REPORT_ID, "escalated");
    expect(mocks.dispatchAlert).not.toHaveBeenCalled();

    const savedClassification = mocks.saveClassification.mock.calls[0][0];
    expect(savedClassification.output.insufficientEvidence).toBe(true);
    expect(savedClassification.output.classification).toBe("elevated_risk");
  });
});

describe("runClassificationPipeline — confident classification", () => {
  it("dispatches a verified_warning alert for strong, corroborated evidence", async () => {
    mocks.getRainfallEvidence.mockResolvedValue({ source: "open_meteo", quality: "ok", mm3h: 38.5 });
    mocks.getFloodRiskEvidence.mockResolvedValue({
      source: "arcgis_flood_risk",
      quality: "ok",
      inRiskZone: true,
      riskLevel: "high",
    });
    mocks.getHistoricalBaseRate.mockResolvedValue({ source: "historical_base_rate", quality: "ok", baseRate: 0.6 });
    mocks.getAmbassadorGroundTruth.mockResolvedValue(unavailable("ambassador_ground_truth"));
    mocks.matchRumorPattern.mockResolvedValue(unavailable("rumor_pattern_similarity"));
    mocks.countRecentCorroborations.mockResolvedValue(2);

    await runClassificationPipeline(REPORT_ID);

    expect(mocks.createEscalation).not.toHaveBeenCalled();
    expect(mocks.updateReportStatus).toHaveBeenCalledWith(REPORT_ID, "classified");
    expect(mocks.dispatchAlert).toHaveBeenCalledTimes(1);

    const dispatchArgs = mocks.dispatchAlert.mock.calls[0][0];
    expect(dispatchArgs.classification).toBe("verified_warning");
    expect(dispatchArgs.reportId).toBe(REPORT_ID);
    expect(dispatchArgs.pilotAreaId).toBe(PILOT_AREA_ID);

    const savedClassification = mocks.saveClassification.mock.calls[0][0];
    expect(savedClassification.output.confidence).toBeGreaterThan(0.6);
  });
});

describe("runClassificationPipeline — the reporter is never left in silence", () => {
  it("acknowledges an escalated report to the reporter instead of returning silently", async () => {
    allEvidenceUnavailable();
    mocks.getReporterContact.mockResolvedValue({ channel: "whatsapp", phone: "+254712345678" });
    mocks.sendUnderReviewAcknowledgement.mockResolvedValue({
      status: "sent",
      providerMessageId: "wamid.1",
      error: null,
    });

    await runClassificationPipeline(REPORT_ID);

    expect(mocks.dispatchAlert).not.toHaveBeenCalled();
    expect(mocks.sendUnderReviewAcknowledgement).toHaveBeenCalledTimes(1);

    const ackArgs = mocks.sendUnderReviewAcknowledgement.mock.calls[0][0];
    expect(ackArgs.reporterChannel).toBe("whatsapp");
    expect(ackArgs.reporterPhoneE164).toBe("+254712345678");
    expect(ackArgs.pilotAreaName).toBe("Mukuru kwa Reuben");

    const ackAudit = mocks.writeAuditEvent.mock.calls
      .map((c) => c[0])
      .find((e) => e.action === "under_review_acknowledgement");
    expect(ackAudit?.payload.sent).toBe(true);
  });

  it("records the acknowledgement as unsent when no contact channel was captured", async () => {
    allEvidenceUnavailable();
    mocks.getReporterContact.mockResolvedValue(null);

    await runClassificationPipeline(REPORT_ID);

    const ackAudit = mocks.writeAuditEvent.mock.calls
      .map((c) => c[0])
      .find((e) => e.action === "under_review_acknowledgement");
    expect(ackAudit?.payload.sent).toBe(false);
    expect(ackAudit?.payload.channel).toBeNull();
  });
});

describe("runClassificationPipeline — outbound language", () => {
  it("persists the detected language and dispatches in it", async () => {
    strongFloodEvidence();
    mocks.extractMessage.mockResolvedValue({
      model: "sandbox-heuristic",
      raw: {},
      keyClaims: [],
      hazardTypeGuess: "flood",
      claimedLocationText: "near the bridge",
      language: "sw",
      urgencySignal: "high",
    });

    await runClassificationPipeline(REPORT_ID);

    expect(mocks.updateReportLanguage).toHaveBeenCalledWith(REPORT_ID, "sw");
    expect(mocks.dispatchAlert.mock.calls[0][0].language).toBe("sw");
  });

  it("falls back to Swahili when the language could not be detected", async () => {
    strongFloodEvidence();
    mocks.extractMessage.mockResolvedValue({
      model: "sandbox-heuristic",
      raw: {},
      keyClaims: [],
      hazardTypeGuess: "flood",
      claimedLocationText: "near the bridge",
      language: null,
      urgencySignal: "high",
    });

    await runClassificationPipeline(REPORT_ID);

    expect(mocks.dispatchAlert.mock.calls[0][0].language).toBe("sw");
  });
});
