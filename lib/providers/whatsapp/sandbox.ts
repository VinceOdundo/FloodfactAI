import type { SendMessageResult } from "./types";

/** Logs the outbound message instead of calling Meta — always "sent" so the pipeline can be demoed end-to-end. */
export function sendWhatsAppSandbox(toE164: string, body: string): SendMessageResult {
  console.info(`[sandbox:whatsapp] -> ${toE164}: ${body}`);
  return { status: "sent", providerMessageId: `sandbox-${Date.now()}`, error: null };
}
