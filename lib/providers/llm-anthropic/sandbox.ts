import type { MessageExtraction, RationaleInput, RationaleOutput } from "./types";

const RUMOR_KEYWORDS = ["dam", "burst", "bomba", "imepasuka", "wanasema", "nimesikia", "voice note"];
const SWAHILI_MARKERS = ["mvua", "maji", "wanasema", "nimesikia", "karibu", "sasa"];

/** Deterministic heuristic extraction — no external call. Good enough to drive the pipeline end-to-end without a key. */
export function extractMessageSandbox(rawText: string): MessageExtraction {
  const lower = rawText.toLowerCase();
  const looksLikeRumor = RUMOR_KEYWORDS.some((k) => lower.includes(k));
  const looksSwahili = SWAHILI_MARKERS.some((k) => lower.includes(k));
  const looksLikeQuestion = rawText.trim().endsWith("?");

  return {
    hazardTypeGuess: looksLikeQuestion ? "other" : looksLikeRumor ? "rumor" : "flood",
    claimedLocationText: null,
    keyClaims: [rawText.trim()].filter(Boolean),
    language: looksSwahili ? "sw" : "en",
    urgencySignal: looksLikeRumor ? "high" : "medium",
    model: "sandbox-extractor-v1",
    raw: { note: "deterministic sandbox extraction, no external LLM call" },
  };
}

/** Deterministic rationale text built directly from the risk engine's own evidence list — no external call. */
export function generateRationaleSandbox(input: RationaleInput): RationaleOutput {
  const evidence = input.evidenceRationale.join(" ");
  const enVerb = { verified_warning: "confirms", elevated_risk: "suggests elevated risk in", false_information: "does not support the claim about" }[
    input.classification
  ];

  return {
    en: `Evidence ${enVerb} ${input.pilotAreaName}. ${evidence}`.trim(),
    sw: `Ushahidi kutoka ${input.pilotAreaName}: ${evidence}`.trim(),
  };
}
