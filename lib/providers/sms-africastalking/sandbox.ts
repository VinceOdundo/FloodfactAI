import type { SendMessageResult } from "../whatsapp/types";

export function sendSmsSandbox(toE164: string, message: string): SendMessageResult {
  console.info(`[sandbox:sms] -> ${toE164}: ${message}`);
  return { status: "sent", providerMessageId: `sandbox-${Date.now()}`, error: null };
}
