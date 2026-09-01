export type HazardType = "flood" | "rumor" | "other";

export type Classification = "verified_warning" | "elevated_risk" | "false_information";

export type EvidenceQuality = "ok" | "degraded" | "unavailable";

interface EvidenceBase {
  quality: EvidenceQuality;
}

/** Rainfall over the last 3 hours at the report's resolved location. Open-Meteo. */
export interface RainfallEvidence extends EvidenceBase {
  source: "open_meteo";
  mm3h: number | null;
}

/** Does the resolved point fall inside a mapped flood-risk zone? Esri ArcGIS. */
export interface FloodRiskZoneEvidence extends EvidenceBase {
  source: "arcgis_flood_risk";
  inRiskZone: boolean | null;
  riskLevel: "low" | "moderate" | "high" | null;
}

/** How often has this area flooded before, in-season? Our own historical table. */
export interface HistoricalBaseRateEvidence extends EvidenceBase {
  source: "historical_base_rate";
  baseRate: number | null; // 0..1
}

/** How many other reports mention the same hazard nearby, recently? */
export interface CorroborationEvidence extends EvidenceBase {
  source: "corroboration";
  recentReportCount: number | null;
}

/** A trained youth ambassador's own eyes on the ground. The strongest single signal. */
export interface AmbassadorGroundTruthEvidence extends EvidenceBase {
  source: "ambassador_ground_truth";
  waterLevelCm: number | null;
  visuallyConfirmed: boolean | null; // true = confirmed flooding, false = checked, found none, null = not checked
}

/** Cosine similarity to the nearest known-false rumor pattern (pgvector). */
export interface RumorPatternSimilarityEvidence extends EvidenceBase {
  source: "rumor_pattern_similarity";
  maxSimilarity: number | null; // 0..1
  matchedPatternCategory: string | null;
}

export type EvidenceItem =
  | RainfallEvidence
  | FloodRiskZoneEvidence
  | HistoricalBaseRateEvidence
  | CorroborationEvidence
  | AmbassadorGroundTruthEvidence
  | RumorPatternSimilarityEvidence;

export interface RiskEngineInput {
  hazardType: HazardType;
  evidence: EvidenceItem[];
}

export interface RiskEngineOutput {
  classification: Classification;
  confidence: number; // 0..1
  /**
   * True whenever there isn't enough usable evidence to decide responsibly.
   * When true, `classification` is always "elevated_risk" — insufficient
   * evidence must never be presented as a confident "false" or "verified"
   * (SRS §13, NFR-03, NFR-05).
   */
  insufficientEvidence: boolean;
  /** True when two or more available signals meaningfully disagree. */
  conflictingEvidence: boolean;
  /** Distinct from "no evidence of flooding" — see SRS §13. */
  evidenceOfFlooding: boolean;
  evidenceOfNoFlooding: boolean;
  /** Evidence-grounded reasons, most important first. Used verbatim in explainability output. */
  rationale: string[];
  /** Raw 0..1 internal score, exposed for testing/debugging — not a public API contract. */
  floodEvidenceScore: number | null;
  engineVersion: string;
}
