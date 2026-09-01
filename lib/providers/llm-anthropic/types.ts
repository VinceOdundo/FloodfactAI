import type { Classification, HazardType } from "@/lib/core/types";

export interface MessageExtraction {
  hazardTypeGuess: HazardType;
  claimedLocationText: string | null;
  keyClaims: string[];
  language: string | null;
  urgencySignal: "low" | "medium" | "high";
  model: string;
  raw: unknown;
}

export interface RationaleInput {
  classification: Classification;
  confidence: number;
  evidenceRationale: string[];
  pilotAreaName: string;
}

export interface RationaleOutput {
  en: string;
  sw: string;
}
