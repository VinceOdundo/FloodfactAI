import type {
  AmbassadorGroundTruthEvidence,
  Classification,
  CorroborationEvidence,
  EvidenceItem,
  FloodRiskZoneEvidence,
  HistoricalBaseRateEvidence,
  RainfallEvidence,
  RiskEngineInput,
  RiskEngineOutput,
  RumorPatternSimilarityEvidence,
} from "./types";

export const ENGINE_VERSION = "risk-engine-1.0.0";

/**
 * FloodFact AI's safety-critical decision core.
 *
 * This function is deliberately NOT an LLM call. It is a small, pure,
 * exhaustively-tested weighted rule set. An LLM is used elsewhere in the
 * pipeline (see lib/providers/llm-anthropic) only to *understand* the raw
 * message and to *explain* the verdict this function already reached — it
 * never makes the verdict itself. See docs/ARCHITECTURE.md for why.
 *
 * Encoded safety rules (each has a dedicated test in
 * tests/unit/risk-engine.test.ts):
 *  1. Fewer than two usable evidence sources (and no direct ambassador
 *     check) => insufficientEvidence = true => always "elevated_risk",
 *     never a confident verdict in either direction.
 *  2. A signal that is merely *unavailable* contributes nothing to the
 *     score — it is excluded from the average entirely, never treated as
 *     "0" (missing data must never read as evidence of no risk).
 *  3. Corroboration (repetition) is one signal among several and is
 *     weighted below direct physical/geographic/human evidence, so
 *     popularity alone cannot manufacture a confident verdict.
 *  4. When available signals meaningfully disagree, conflictingEvidence is
 *     surfaced and the result is pulled toward escalation rather than
 *     silently averaged away.
 *  5. "No evidence of flooding" (evidenceOfFlooding=false) and "evidence
 *     that flooding is not occurring" (evidenceOfNoFlooding=true) are
 *     tracked as distinct states; only the latter can support a confident
 *     False Information verdict.
 */
export function scoreReport(input: RiskEngineInput): RiskEngineOutput {
  const rainfall = findEvidence<RainfallEvidence>(input.evidence, "open_meteo");
  const riskZone = findEvidence<FloodRiskZoneEvidence>(input.evidence, "arcgis_flood_risk");
  const historical = findEvidence<HistoricalBaseRateEvidence>(input.evidence, "historical_base_rate");
  const corroboration = findEvidence<CorroborationEvidence>(input.evidence, "corroboration");
  const ambassador = findEvidence<AmbassadorGroundTruthEvidence>(input.evidence, "ambassador_ground_truth");
  const rumor = findEvidence<RumorPatternSimilarityEvidence>(input.evidence, "rumor_pattern_similarity");

  const signals = buildWeightedSignals({ rainfall, riskZone, historical, corroboration, ambassador });
  const availableCount = signals.filter((s) => s.value !== null).length;

  const ambassadorConfirmed = valueOr(ambassador?.visuallyConfirmed, null) === true;
  const ambassadorDenied = valueOr(ambassador?.visuallyConfirmed, null) === false;

  const floodEvidenceScore = weightedAverage(signals);

  const rumorSimilarity = ok(rumor) ? rumor!.maxSimilarity : null;
  const strongRumorMatch = rumorSimilarity !== null && rumorSimilarity >= 0.8;
  const moderateRumorMatch = rumorSimilarity !== null && rumorSimilarity >= 0.55;

  const evidenceOfFlooding =
    ambassadorConfirmed || (floodEvidenceScore !== null && floodEvidenceScore >= 0.35);

  const evidenceOfNoFlooding =
    ambassadorDenied ||
    (floodEvidenceScore !== null && floodEvidenceScore < 0.15 && availableCount >= 2);

  // A human who checked and found nothing, contradicted by strong
  // independent physical/geographic evidence, is the one case we surface
  // as a genuine conflict rather than silently picking a side — the
  // ambassador may simply not have checked the exact spot the sensors
  // cover. A positive confirmation is trusted on its own (see below): a
  // trained human physically seeing water is a much stronger signal than
  // a false positive from coarse remote data.
  const remoteScoreExcludingAmbassador = floodEvidenceScoreExcludingAmbassador(signals);
  const conflictingEvidence =
    ambassadorDenied && remoteScoreExcludingAmbassador !== null && remoteScoreExcludingAmbassador >= 0.5;

  const insufficientEvidence =
    !ambassadorConfirmed && !ambassadorDenied && availableCount < 2 && !strongRumorMatch;

  // Rule 1: insufficient evidence always wins, and always means "ask a human".
  if (insufficientEvidence) {
    return finish({
      classification: "elevated_risk",
      confidence: 0.3,
      insufficientEvidence: true,
      conflictingEvidence,
      evidenceOfFlooding,
      evidenceOfNoFlooding,
      rationale: [
        "Not enough independent evidence was available to reach a confident verdict.",
        ...describeAvailability({ rainfall, riskZone, historical, corroboration, ambassador }),
        "Routed to a human operator rather than guessed.",
      ],
      floodEvidenceScore,
    });
  }

  // Ambassador ground truth is the strongest single signal: a trained
  // human who actually looked. A positive confirmation settles the case on
  // its own, regardless of what coarser remote signals say.
  if (ambassadorConfirmed) {
    return finish({
      classification: "verified_warning",
      confidence: clamp(0.85 + (floodEvidenceScore ?? 0) * 0.1, 0, 0.97),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding: true,
      evidenceOfNoFlooding: false,
      rationale: [
        "A trained youth ambassador visually confirmed flooding on the ground.",
        ...explainSignals(signals),
      ],
      floodEvidenceScore,
    });
  }

  // A denial that contradicts strong independent evidence is surfaced, not
  // resolved by picking a side.
  if (conflictingEvidence) {
    return finish({
      classification: "elevated_risk",
      confidence: 0.4,
      insufficientEvidence: false,
      conflictingEvidence: true,
      evidenceOfFlooding,
      evidenceOfNoFlooding: false,
      rationale: [
        "A trained youth ambassador found no flooding, but independent evidence (rainfall, flood-risk zone, or history) suggests otherwise.",
        ...explainSignals(signals),
        "Routed to a human operator for review rather than resolved automatically.",
      ],
      floodEvidenceScore,
    });
  }

  if (ambassadorDenied) {
    const classification: Classification =
      input.hazardType === "rumor" || moderateRumorMatch ? "false_information" : "elevated_risk";
    return finish({
      classification,
      confidence: clamp(0.6 + (rumorSimilarity ?? 0) * 0.2, 0, 0.9),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding: false,
      evidenceOfNoFlooding: true,
      rationale: [
        "A trained youth ambassador checked on the ground and found no flooding.",
        ...explainSignals(signals),
      ],
      floodEvidenceScore,
    });
  }

  // Strong match to a confirmed-false rumor pattern, with no supporting
  // physical evidence of an actual flood: False Information.
  if (strongRumorMatch && !evidenceOfFlooding) {
    return finish({
      classification: "false_information",
      confidence: clamp(0.5 + rumorSimilarity! * 0.4, 0, 0.93),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding: false,
      evidenceOfNoFlooding: evidenceOfNoFlooding || availableCount >= 2,
      rationale: [
        `This message closely matches a previously confirmed false claim (${fmtPct(rumorSimilarity!)} similarity).`,
        ...explainSignals(signals),
      ],
      floodEvidenceScore,
    });
  }

  // Strong physical/geographic evidence of an actual flood.
  if (floodEvidenceScore !== null && floodEvidenceScore >= 0.65) {
    return finish({
      classification: "verified_warning",
      confidence: clamp(floodEvidenceScore, 0.6, 0.95),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding: true,
      evidenceOfNoFlooding: false,
      rationale: explainSignals(signals),
      floodEvidenceScore,
    });
  }

  // Moderate evidence, or a moderate rumor-pattern match without a clear
  // "no flooding" signal to back up dismissing it: elevated risk, not a
  // confident verdict either way.
  if ((floodEvidenceScore !== null && floodEvidenceScore >= 0.35) || moderateRumorMatch) {
    return finish({
      classification: "elevated_risk",
      confidence: clamp(floodEvidenceScore ?? 0.5, 0.35, 0.7),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding,
      evidenceOfNoFlooding: false,
      rationale: [
        ...explainSignals(signals),
        moderateRumorMatch
          ? `Message has some similarity (${fmtPct(rumorSimilarity!)}) to a known false pattern, but this is not conclusive.`
          : undefined,
      ].filter(isString),
      floodEvidenceScore,
    });
  }

  // Weak/no flood evidence, and evidence actively suggests no flooding —
  // False Information only when that lack of support is itself well
  // supported (>=2 available signals), never from silence alone.
  if (evidenceOfNoFlooding && (input.hazardType === "rumor" || rumorSimilarity !== null)) {
    return finish({
      classification: "false_information",
      confidence: clamp(0.55 + (rumorSimilarity ?? 0) * 0.25, 0, 0.85),
      insufficientEvidence: false,
      conflictingEvidence: false,
      evidenceOfFlooding: false,
      evidenceOfNoFlooding: true,
      rationale: [
        "Available evidence indicates no flooding is occurring at this location.",
        ...explainSignals(signals),
      ],
      floodEvidenceScore,
    });
  }

  // Conservative default: weak evidence, not clearly a known rumor pattern
  // either. We do not have grounds to call this confidently false.
  return finish({
    classification: "elevated_risk",
    confidence: clamp(floodEvidenceScore ?? 0.4, 0.3, 0.55),
    insufficientEvidence: false,
    conflictingEvidence: false,
    evidenceOfFlooding,
    evidenceOfNoFlooding,
    rationale: [
      "Evidence is weak or mixed; treating as an elevated-risk precaution rather than a confident verdict.",
      ...explainSignals(signals),
    ],
    floodEvidenceScore,
  });

  function finish(partial: Omit<RiskEngineOutput, "engineVersion">): RiskEngineOutput {
    return { ...partial, engineVersion: ENGINE_VERSION };
  }
}

// ── internals ────────────────────────────────────────────────────────────

function findEvidence<T extends EvidenceItem>(evidence: EvidenceItem[], source: T["source"]): T | undefined {
  return evidence.find((e) => e.source === source) as T | undefined;
}

function ok(e: EvidenceItem | undefined): boolean {
  return !!e && e.quality !== "unavailable";
}

function valueOr<T>(v: T | null | undefined, fallback: T | null): T | null {
  return v === undefined ? fallback : v;
}

interface WeightedSignal {
  label: string;
  value: number | null; // normalized 0..1, or null if unavailable
  weight: number; // already includes the quality multiplier (degraded counts for less)
  describe: (v: number) => string;
}

/** "ok" counts in full; "degraded" counts, but for less — never as much as a clean reading. */
function qualityMultiplier(e: EvidenceItem | undefined): number {
  if (!e) return 0;
  if (e.quality === "ok") return 1;
  if (e.quality === "degraded") return 0.5;
  return 0;
}

function buildWeightedSignals(sources: {
  rainfall?: RainfallEvidence;
  riskZone?: FloodRiskZoneEvidence;
  historical?: HistoricalBaseRateEvidence;
  corroboration?: CorroborationEvidence;
  ambassador?: AmbassadorGroundTruthEvidence;
}): WeightedSignal[] {
  const { rainfall, riskZone, historical, corroboration, ambassador } = sources;

  const rainfallValue =
    ok(rainfall) && rainfall!.mm3h !== null ? clamp(rainfall!.mm3h / 30, 0, 1) : null;

  const riskZoneValue =
    ok(riskZone) && riskZone!.inRiskZone !== null ? (riskZone!.inRiskZone ? 1 : 0) : null;

  const historicalValue = ok(historical) ? historical!.baseRate : null;

  const corroborationValue =
    ok(corroboration) && corroboration!.recentReportCount !== null
      ? clamp(corroboration!.recentReportCount / 3, 0, 1)
      : null;

  // Ambassador water-level reading, when present but not a plain yes/no
  // visual confirmation (that case is handled as an early return above).
  const ambassadorValue =
    ok(ambassador) && ambassador!.waterLevelCm !== null ? clamp(ambassador!.waterLevelCm / 40, 0, 1) : null;

  return [
    { label: "rainfall", value: rainfallValue, weight: 1.2 * qualityMultiplier(rainfall), describe: (v) => `Rainfall reading corresponds to ${fmtPct(v)} of the high-intensity threshold.` },
    { label: "risk zone", value: riskZoneValue, weight: 1.0 * qualityMultiplier(riskZone), describe: (v) => (v >= 1 ? "Location falls inside a mapped flood-risk zone." : "Location falls outside any mapped flood-risk zone.") },
    { label: "historical", value: historicalValue, weight: 0.8 * qualityMultiplier(historical), describe: (v) => `Historical base rate of flooding here is ${fmtPct(v)}.` },
    { label: "corroboration", value: corroborationValue, weight: 0.7 * qualityMultiplier(corroboration), describe: (v) => `${Math.round(v * 3)} other nearby report(s) in the same time window.` },
    { label: "ambassador water level", value: ambassadorValue, weight: 1.5 * qualityMultiplier(ambassador), describe: (v) => `Ambassador-reported water level corresponds to ${fmtPct(v)} of the flood threshold.` },
  ];
}

function weightedAverage(signals: WeightedSignal[]): number | null {
  const available = signals.filter((s) => s.value !== null);
  if (available.length === 0) return null;
  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = available.reduce((sum, s) => sum + s.value! * s.weight, 0);
  return clamp(weightedSum / totalWeight, 0, 1);
}

function floodEvidenceScoreExcludingAmbassador(signals: WeightedSignal[]): number | null {
  return weightedAverage(signals.filter((s) => s.label !== "ambassador water level"));
}

function explainSignals(signals: WeightedSignal[]): string[] {
  return signals.filter((s) => s.value !== null).map((s) => s.describe(s.value!));
}

function describeAvailability(sources: Record<string, EvidenceItem | undefined>): string[] {
  return Object.entries(sources)
    .filter(([, e]) => !ok(e))
    .map(([label]) => `${label} data was unavailable at verification time.`);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function fmtPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}
