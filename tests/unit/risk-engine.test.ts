import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, scoreReport } from "@/lib/core/risk-engine";
import type {
  AmbassadorGroundTruthEvidence,
  CorroborationEvidence,
  EvidenceItem,
  FloodRiskZoneEvidence,
  HistoricalBaseRateEvidence,
  RainfallEvidence,
  RumorPatternSimilarityEvidence,
} from "@/lib/core/types";

const rainfall = (mm3h: number | null, quality: RainfallEvidence["quality"] = "ok"): RainfallEvidence => ({
  source: "open_meteo",
  quality,
  mm3h,
});

const riskZone = (
  inRiskZone: boolean | null,
  quality: FloodRiskZoneEvidence["quality"] = "ok"
): FloodRiskZoneEvidence => ({
  source: "arcgis_flood_risk",
  quality,
  inRiskZone,
  riskLevel: inRiskZone ? "high" : "low",
});

const historical = (baseRate: number | null, quality: HistoricalBaseRateEvidence["quality"] = "ok"): HistoricalBaseRateEvidence => ({
  source: "historical_base_rate",
  quality,
  baseRate,
});

const corroboration = (
  recentReportCount: number | null,
  quality: CorroborationEvidence["quality"] = "ok"
): CorroborationEvidence => ({
  source: "corroboration",
  quality,
  recentReportCount,
});

const ambassador = (
  opts: { waterLevelCm?: number | null; visuallyConfirmed?: boolean | null },
  quality: AmbassadorGroundTruthEvidence["quality"] = "ok"
): AmbassadorGroundTruthEvidence => ({
  source: "ambassador_ground_truth",
  quality,
  waterLevelCm: opts.waterLevelCm ?? null,
  visuallyConfirmed: opts.visuallyConfirmed ?? null,
});

const rumorSimilarity = (
  maxSimilarity: number | null,
  quality: RumorPatternSimilarityEvidence["quality"] = "ok"
): RumorPatternSimilarityEvidence => ({
  source: "rumor_pattern_similarity",
  quality,
  maxSimilarity,
  matchedPatternCategory: "dam_burst",
});

const unavailable = (source: EvidenceItem["source"]): EvidenceItem => {
  switch (source) {
    case "open_meteo":
      return rainfall(null, "unavailable");
    case "arcgis_flood_risk":
      return riskZone(null, "unavailable");
    case "historical_base_rate":
      return historical(null, "unavailable");
    case "corroboration":
      return corroboration(null, "unavailable");
    case "ambassador_ground_truth":
      return ambassador({}, "unavailable");
    case "rumor_pattern_similarity":
      return rumorSimilarity(null, "unavailable");
  }
};

const ALL_SOURCES: EvidenceItem["source"][] = [
  "open_meteo",
  "arcgis_flood_risk",
  "historical_base_rate",
  "corroboration",
  "ambassador_ground_truth",
];

describe("scoreReport — Rule 1: insufficient evidence never yields a confident verdict", () => {
  it("returns elevated_risk with insufficientEvidence=true when there is no evidence at all", () => {
    const out = scoreReport({ hazardType: "flood", evidence: [] });
    expect(out.insufficientEvidence).toBe(true);
    expect(out.classification).toBe("elevated_risk");
    expect(out.confidence).toBeLessThanOrEqual(0.3);
  });

  it("returns insufficientEvidence=true when every evidence source is explicitly unavailable", () => {
    const out = scoreReport({ hazardType: "flood", evidence: ALL_SOURCES.map(unavailable) });
    expect(out.insufficientEvidence).toBe(true);
    expect(out.classification).toBe("elevated_risk");
  });

  it("returns insufficientEvidence=true with exactly one available (non-ambassador) signal", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(50), unavailable("arcgis_flood_risk"), unavailable("historical_base_rate")],
    });
    expect(out.insufficientEvidence).toBe(true);
    expect(out.classification).toBe("elevated_risk");
  });

  it("a single very strong signal is still insufficient — it takes two independent sources to be confident", () => {
    // 60mm/3h would normalize to 1.0 on its own — but alone, it's not enough.
    const out = scoreReport({ hazardType: "flood", evidence: [rainfall(60)] });
    expect(out.insufficientEvidence).toBe(true);
    expect(out.classification).not.toBe("verified_warning");
    expect(out.classification).not.toBe("false_information");
  });

  it("becomes sufficient at exactly two available signals", () => {
    const out = scoreReport({ hazardType: "flood", evidence: [rainfall(30), riskZone(true)] });
    expect(out.insufficientEvidence).toBe(false);
  });

  it("never returns false_information or verified_warning across many under-evidenced combinations", () => {
    const partials: EvidenceItem[][] = [
      [],
      [rainfall(40)],
      [riskZone(true)],
      [historical(0.9)],
      [corroboration(5)],
      [rainfall(0)],
      [riskZone(false)],
    ];
    for (const evidence of partials) {
      const out = scoreReport({ hazardType: "flood", evidence });
      expect(out.classification, `evidence=${JSON.stringify(evidence)}`).toBe("elevated_risk");
    }
  });
});

describe("scoreReport — Rule 2: unavailable data is excluded, never treated as zero", () => {
  it("reaches verified_warning from available strong signals even when rainfall and risk-zone are unavailable", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [
        unavailable("open_meteo"),
        unavailable("arcgis_flood_risk"),
        historical(0.9),
        corroboration(3),
        ambassador({ waterLevelCm: 40 }),
      ],
    });
    expect(out.insufficientEvidence).toBe(false);
    expect(out.classification).toBe("verified_warning");
  });

  it("degraded quality still contributes, but pulls the blended score less than a clean 'ok' reading would", () => {
    // riskZone=true (value 1) agrees strongly with a flood; rainfall is low
    // (value ~0.07) and disagrees. A degraded risk-zone reading should sway
    // the blended score toward "flood" less than a clean one would.
    const degraded = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(2), riskZone(true, "degraded")],
    });
    const clean = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(2), riskZone(true, "ok")],
    });
    expect(degraded.floodEvidenceScore).not.toBeNull();
    expect(degraded.floodEvidenceScore!).toBeLessThan(clean.floodEvidenceScore!);
  });
});

describe("scoreReport — Rule 3: corroboration (popularity) cannot alone manufacture a verdict", () => {
  it("high corroboration with everything else unavailable is still insufficient", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [corroboration(20), unavailable("open_meteo"), unavailable("arcgis_flood_risk")],
    });
    expect(out.insufficientEvidence).toBe(true);
  });

  it("high corroboration plus one weak physical signal does not reach verified_warning", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [corroboration(20), rainfall(2), riskZone(false)],
    });
    expect(out.classification).not.toBe("verified_warning");
  });

  it("corroboration is weighted below rainfall and risk-zone evidence", () => {
    const withCorroboration = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(15), riskZone(false), corroboration(10)],
    });
    const withoutCorroboration = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(15), riskZone(false)],
    });
    // Adding a maxed-out corroboration signal should nudge, not dominate, the score.
    expect(withCorroboration.floodEvidenceScore! - withoutCorroboration.floodEvidenceScore!).toBeLessThan(0.35);
  });
});

describe("scoreReport — Rule 4: conflicting evidence is surfaced, not silently resolved", () => {
  it("flags a conflict when an ambassador denies flooding but remote evidence strongly disagrees", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(30), riskZone(true), historical(0.8), ambassador({ visuallyConfirmed: false })],
    });
    expect(out.conflictingEvidence).toBe(true);
    expect(out.classification).toBe("elevated_risk");
    expect(out.insufficientEvidence).toBe(false);
  });

  it("trusts a positive ambassador confirmation even against weak remote signals", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(1), riskZone(false), ambassador({ visuallyConfirmed: true })],
    });
    expect(out.classification).toBe("verified_warning");
    expect(out.conflictingEvidence).toBe(false);
  });

  it("does not flag a conflict when ambassador denial agrees with weak remote evidence", () => {
    const out = scoreReport({
      hazardType: "rumor",
      evidence: [rainfall(1), riskZone(false), ambassador({ visuallyConfirmed: false })],
    });
    expect(out.conflictingEvidence).toBe(false);
    expect(out.classification).toBe("false_information");
  });
});

describe("scoreReport — Rule 5: 'no evidence of flooding' vs 'evidence of no flooding'", () => {
  it("a rumor-flagged report with real flood evidence present is NOT classified as false information", () => {
    const out = scoreReport({
      hazardType: "rumor",
      evidence: [rumorSimilarity(0.95), rainfall(35), riskZone(true), historical(0.7)],
    });
    expect(out.classification).not.toBe("false_information");
    expect(out.evidenceOfFlooding).toBe(true);
  });

  it("a rumor-flagged report with clear evidence of no flooding is classified as false information", () => {
    const out = scoreReport({
      hazardType: "rumor",
      evidence: [rumorSimilarity(0.95), rainfall(1), riskZone(false), historical(0.05)],
    });
    expect(out.classification).toBe("false_information");
    expect(out.evidenceOfNoFlooding).toBe(true);
  });

  it("a direct flood report with merely weak evidence (no rumor signal) is not called false — it stays elevated_risk", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(3), riskZone(false)],
    });
    expect(out.classification).toBe("elevated_risk");
  });
});

describe("scoreReport — realistic end-to-end scenarios", () => {
  it("Kanini Road: heavy rain + risk zone + history + corroboration => verified_warning, high confidence", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(38.5), riskZone(true), historical(0.6), corroboration(2)],
    });
    expect(out.classification).toBe("verified_warning");
    expect(out.confidence).toBeGreaterThan(0.6);
  });

  it("Njenga dam rumor: strong rumor match + minimal rain + outside risk zone => false_information", () => {
    const out = scoreReport({
      hazardType: "rumor",
      evidence: [rumorSimilarity(0.91), rainfall(2.1), riskZone(false)],
    });
    expect(out.classification).toBe("false_information");
  });

  it("Viwandani degraded reading: moderate rain + a degraded (less-trusted) risk-zone hit => elevated_risk", () => {
    const out = scoreReport({
      hazardType: "flood",
      evidence: [rainfall(15), riskZone(true, "degraded")],
    });
    expect(out.classification).toBe("elevated_risk");
    expect(out.classification).not.toBe("verified_warning");
  });
});

describe("scoreReport — purity and metadata", () => {
  it("is a pure function: identical input yields identical output", () => {
    const input = { hazardType: "flood" as const, evidence: [rainfall(20), riskZone(true)] };
    const a = scoreReport(input);
    const b = scoreReport(input);
    expect(a).toEqual(b);
  });

  it("always stamps the current engine version", () => {
    const out = scoreReport({ hazardType: "flood", evidence: [rainfall(20), riskZone(true)] });
    expect(out.engineVersion).toBe(ENGINE_VERSION);
  });

  it("confidence is always within [0, 1]", () => {
    const scenarios: EvidenceItem[][] = [
      [],
      [rainfall(1000)],
      [rainfall(-5), riskZone(true)],
      [rumorSimilarity(1), rainfall(0), riskZone(false)],
      [ambassador({ visuallyConfirmed: true }), rainfall(0)],
    ];
    for (const evidence of scenarios) {
      const out = scoreReport({ hazardType: "flood", evidence });
      expect(out.confidence).toBeGreaterThanOrEqual(0);
      expect(out.confidence).toBeLessThanOrEqual(1);
    }
  });
});
