import "server-only";
import { env } from "@/lib/config/env";
import { fetchWithTimeout } from "../shared";
import type { SendMessageResult } from "../whatsapp/types";

interface AfricasTalkingResponse {
  SMSMessageData?: {
    Recipients: Array<{ number: string; status: string; messageId: string }>;
  };
}

/** AT's own "sandbox" username hits a separate test subdomain — real calls, test environment. */
function baseUrl(): string {
  return env.AT_USERNAME === "sandbox"
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";
}

export async function sendSmsLive(toE164: string, message: string): Promise<SendMessageResult> {
  const body = new URLSearchParams({
    username: env.AT_USERNAME,
    to: toE164,
    message,
    ...(env.AT_SHORTCODE ? { from: env.AT_SHORTCODE } : {}),
  });

  const res = await fetchWithTimeout(`${baseUrl()}/version1/messaging`, {
    method: "POST",
    timeoutMs: 8000,
    headers: {
      apiKey: env.AT_API_KEY!,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as AfricasTalkingResponse;
  const recipient = data.SMSMessageData?.Recipients?.[0];
  if (!res.ok || !recipient || !recipient.status?.toLowerCase().startsWith("success")) {
    return { status: "failed", providerMessageId: null, error: recipient?.status ?? `HTTP ${res.status}` };
  }
  return { status: "sent", providerMessageId: recipient.messageId, error: null };
}
