import "server-only";
import { providerMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import { extractMessageLive, generateRationaleLive } from "./live";
import { extractMessageSandbox, generateRationaleSandbox } from "./sandbox";
import type { MessageExtraction, RationaleInput, RationaleOutput } from "./types";

export type { MessageExtraction, RationaleInput, RationaleOutput } from "./types";

export async function extractMessage(rawText: string): Promise<MessageExtraction> {
  if (providerMode.llm() === "sandbox") {
    return extractMessageSandbox(rawText);
  }
  try {
    const result = await extractMessageLive(rawText);
    await recordSourceHealth("llm_anthropic", "live", { ok: true });
    return result;
  } catch (error) {
    await recordSourceHealth("llm_anthropic", "live", { ok: false, error });
    // Understanding the message is not the safety decision — degrade to the
    // deterministic heuristic rather than fail the whole report.
    return extractMessageSandbox(rawText);
  }
}

export async function generateRationale(input: RationaleInput): Promise<RationaleOutput> {
  if (providerMode.llm() === "sandbox") {
    return generateRationaleSandbox(input);
  }
  try {
    const result = await generateRationaleLive(input);
    await recordSourceHealth("llm_anthropic", "live", { ok: true });
    return result;
  } catch (error) {
    await recordSourceHealth("llm_anthropic", "live", { ok: false, error });
    return generateRationaleSandbox(input);
  }
}
