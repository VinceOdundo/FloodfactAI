import "server-only";
import { env } from "@/lib/config/env";
import { fetchWithTimeout } from "../shared";
import type { SendMessageResult } from "./types";

interface WhatsAppSendResponse {
  messages?: Array<{ id: string }>;
  error?: { message: string };
}

/** Sends a free-text session message via the Meta WhatsApp Cloud API. */
export async function sendWhatsAppLive(toE164: string, body: string): Promise<SendMessageResult> {
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    timeoutMs: 8000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164.replace(/^\+/, ""),
      type: "text",
      text: { body, preview_url: false },
    }),
  });

  const data = (await res.json()) as WhatsAppSendResponse;
  if (!res.ok || data.error) {
    return { status: "failed", providerMessageId: null, error: data.error?.message ?? `HTTP ${res.status}` };
  }
  return { status: "sent", providerMessageId: data.messages?.[0]?.id ?? null, error: null };
}
