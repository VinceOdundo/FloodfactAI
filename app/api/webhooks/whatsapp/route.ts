import { NextResponse, after } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/config/env";
import { verifyMetaWebhookSignature } from "@/lib/security/hmac";
import { createReport } from "@/lib/data/reports";
import { runClassificationPipeline } from "@/lib/pipeline/classify";

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{ from: string; text?: { body: string }; type: string }>;
      };
    }>;
  }>;
}

/** Meta's one-time webhook verification handshake. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Inbound message webhook. Always responds 200 quickly — Meta retries (and
 * can eventually disable the webhook) on non-2xx or slow responses, and a
 * retry storm would create duplicate reports. Heavy work happens in
 * `after()`, outside the response path, per-message.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (env.WHATSAPP_APP_SECRET) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyMetaWebhookSignature(rawBody, signature, env.WHATSAPP_APP_SECRET)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true }); // malformed payload — ack anyway, log nothing actionable
  }

  const messages =
    payload.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []) ?? [];

  for (const message of messages) {
    if (message.type !== "text" || !message.text?.body) continue;
    const phoneE164 = message.from.startsWith("+") ? message.from : `+${message.from}`;

    after(async () => {
      try {
        const reportId = await createReport({
          sourceChannel: "whatsapp",
          rawText: message.text!.body,
          phoneE164,
        });
        await runClassificationPipeline(reportId);
      } catch (err) {
        console.error("Failed to process WhatsApp message:", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
