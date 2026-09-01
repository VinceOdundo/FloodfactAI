import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/config/env";
import type { MessageExtraction, RationaleInput, RationaleOutput } from "./types";

function client(): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "record_extraction",
  description:
    "Record structured extraction of a flood/rumor report message. Only include information explicitly present in the message — never infer or assume facts that are not stated.",
  input_schema: {
    type: "object",
    properties: {
      hazardTypeGuess: {
        type: "string",
        enum: ["flood", "rumor", "other"],
        description: "'flood' for a direct observation, 'rumor' for a forwarded/secondhand claim, 'other' otherwise.",
      },
      claimedLocationText: { type: ["string", "null"], description: "Location as stated in the message, verbatim or near-verbatim. Null if none given." },
      keyClaims: { type: "array", items: { type: "string" }, description: "Atomic factual claims made in the message, each independently checkable." },
      language: { type: ["string", "null"], description: "Best-guess language code of the message, e.g. 'en', 'sw'." },
      urgencySignal: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["hazardTypeGuess", "keyClaims", "urgencySignal"],
  },
};

const RATIONALE_TOOL: Anthropic.Tool = {
  name: "record_rationale",
  description: "Record the bilingual (English and Swahili) plain-language rationale for an already-decided flood-report verdict.",
  input_schema: {
    type: "object",
    properties: {
      en: { type: "string" },
      sw: { type: "string" },
    },
    required: ["en", "sw"],
  },
};

export async function extractMessageLive(rawText: string): Promise<MessageExtraction> {
  const response = await client().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system:
      "You extract structured facts from flood-report or rumor messages for a disaster-response system serving Nairobi informal settlements. " +
      "Extract ONLY what is explicitly stated in the message. Never infer, assume, or add information that is not present. " +
      "If something is not mentioned, use null (for optional fields) or an empty array (for keyClaims). Do not speculate about whether the claims are true.",
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "record_extraction" },
    messages: [{ role: "user", content: rawText }],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    throw new Error("Anthropic did not return a tool_use block for extraction");
  }
  const input = toolUse.input as {
    hazardTypeGuess: MessageExtraction["hazardTypeGuess"];
    claimedLocationText: string | null;
    keyClaims: string[];
    language: string | null;
    urgencySignal: MessageExtraction["urgencySignal"];
  };

  return { ...input, model: env.ANTHROPIC_MODEL, raw: response };
}

export async function generateRationaleLive(input: RationaleInput): Promise<RationaleOutput> {
  const response = await client().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system:
      "You write clear, calm, actionable explanations of flood-alert verdicts for residents of Nairobi informal settlements, in English and Swahili. " +
      "The verdict below has ALREADY been decided by a separate evidence-based system — your only job is to explain it plainly. " +
      "Do not change, soften, question, or add confidence beyond the verdict given. Do not invent evidence beyond what is listed. Keep each version to 2-3 short sentences, mobile-friendly.",
    tools: [RATIONALE_TOOL],
    tool_choice: { type: "tool", name: "record_rationale" },
    messages: [
      {
        role: "user",
        content:
          `Verdict: ${input.classification} (confidence ${Math.round(input.confidence * 100)}%)\n` +
          `Area: ${input.pilotAreaName}\n` +
          `Evidence considered:\n${input.evidenceRationale.map((r) => `- ${r}`).join("\n")}`,
      },
    ],
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    throw new Error("Anthropic did not return a tool_use block for rationale");
  }
  return toolUse.input as RationaleOutput;
}
