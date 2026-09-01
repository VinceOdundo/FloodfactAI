import "server-only";
import { providerMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import { sendSmsLive } from "./live";
import { sendSmsSandbox } from "./sandbox";
import type { SendMessageResult } from "../whatsapp/types";

export async function sendSmsMessage(toE164: string, message: string): Promise<SendMessageResult> {
  if (providerMode.sms() === "sandbox") {
    return sendSmsSandbox(toE164, message);
  }
  try {
    const result = await sendSmsLive(toE164, message);
    await recordSourceHealth("sms_africastalking", "live", result.status === "sent" ? { ok: true } : { ok: false, error: result.error });
    return result;
  } catch (error) {
    await recordSourceHealth("sms_africastalking", "live", { ok: false, error });
    return { status: "failed", providerMessageId: null, error: describeError(error) };
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
