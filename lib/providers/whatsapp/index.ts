import "server-only";
import { providerMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import { sendWhatsAppLive } from "./live";
import { sendWhatsAppSandbox } from "./sandbox";
import type { SendMessageResult } from "./types";

export type { SendMessageResult } from "./types";

export async function sendWhatsAppMessage(toE164: string, body: string): Promise<SendMessageResult> {
  if (providerMode.whatsapp() === "sandbox") {
    return sendWhatsAppSandbox(toE164, body);
  }
  try {
    const result = await sendWhatsAppLive(toE164, body);
    await recordSourceHealth("whatsapp", "live", result.status === "sent" ? { ok: true } : { ok: false, error: result.error });
    return result;
  } catch (error) {
    await recordSourceHealth("whatsapp", "live", { ok: false, error });
    return { status: "failed", providerMessageId: null, error: describeError(error) };
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
