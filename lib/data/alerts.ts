import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildAlertMessage,
  buildUnderReviewMessage,
  pickMessageBody,
  type MessageLanguage,
} from "@/lib/core/alert-templates";
import type { Classification } from "@/lib/core/types";
import { sendWhatsAppMessage, type SendMessageResult } from "@/lib/providers/whatsapp";
import { sendSmsMessage } from "@/lib/providers/sms-africastalking";

export interface DispatchAlertInput {
  reportId: string;
  classificationId: string;
  classification: Classification;
  pilotAreaId: string | null;
  pilotAreaName: string;
  locationDetail: string | null;
  topRationale: string[];
  reporterChannel: "whatsapp" | "sms" | null;
  reporterPhoneE164: string | null;
  /** Which language to send in. Both bodies are still stored on the alert row. */
  language: MessageLanguage;
}

function sendToReporter(
  channel: "whatsapp" | "sms",
  phoneE164: string,
  body: string
): Promise<SendMessageResult> {
  return channel === "whatsapp" ? sendWhatsAppMessage(phoneE164, body) : sendSmsMessage(phoneE164, body);
}

/**
 * Builds the outbound message, records the `alerts` row, dispatches to the
 * original reporter's channel when we captured one, and always logs an
 * ambassador_queue delivery — ambassadors see it via their RLS-scoped
 * dashboard the moment the row exists, no separate push needed.
 */
export async function dispatchAlert(input: DispatchAlertInput): Promise<string> {
  const supabase = createServiceClient();
  const message = buildAlertMessage(input.classification, {
    pilotAreaName: input.pilotAreaName,
    locationDetail: input.locationDetail,
    issuedAt: new Date(),
    topRationale: input.topRationale,
  });

  const channels = ["ambassador_queue", ...(input.reporterChannel ? [input.reporterChannel] : [])];

  const { data: alert, error } = await supabase
    .from("alerts")
    .insert({
      classification_id: input.classificationId,
      pilot_area_id: input.pilotAreaId,
      message_en: message.en,
      message_sw: message.sw,
      channels,
      status: "queued",
    })
    .select("id")
    .single();
  if (error || !alert) {
    throw new Error(`Failed to create alert: ${error?.message}`);
  }

  const deliveries: Array<{ channel: string; status: string; provider_message_id: string | null; error: string | null }> = [
    { channel: "ambassador_queue", status: "sent", provider_message_id: null, error: null },
  ];

  if (input.reporterChannel && input.reporterPhoneE164) {
    const result = await sendToReporter(
      input.reporterChannel,
      input.reporterPhoneE164,
      pickMessageBody(message, input.language)
    );
    deliveries.push({
      channel: input.reporterChannel,
      status: result.status,
      provider_message_id: result.providerMessageId,
      error: result.error,
    });
  }

  await supabase.from("alert_deliveries").insert(
    deliveries.map((d) => ({ alert_id: alert.id, channel: d.channel, status: d.status, provider_message_id: d.provider_message_id, error: d.error }))
  );

  const allSent = deliveries.every((d) => d.status === "sent" || d.status === "delivered");
  await supabase
    .from("alerts")
    .update({ status: allSent ? "sent" : deliveries.some((d) => d.status === "sent") ? "partial" : "failed" })
    .eq("id", alert.id);

  return alert.id;
}

export interface UnderReviewAcknowledgementInput {
  pilotAreaName: string;
  locationDetail: string | null;
  reporterChannel: "whatsapp" | "sms" | null;
  reporterPhoneE164: string | null;
  language: MessageLanguage;
}

/**
 * Tells a reporter their report is with a human, on the escalation path where
 * no verdict alert will be sent.
 *
 * Writes no `alerts` or `alert_deliveries` row on purpose: `alerts` rows are
 * published state (they feed the public feed and the ambassador queue) and an
 * acknowledgement carries no verdict. `alert_deliveries.alert_id` is NOT NULL,
 * so there is no way to record the delivery without also publishing an alert —
 * the send result goes to the audit trail instead, via the caller.
 *
 * Returns null when we never captured a contact channel (web reports without a
 * phone number), which is not an error — there is simply nobody to reach yet.
 */
export async function sendUnderReviewAcknowledgement(
  input: UnderReviewAcknowledgementInput
): Promise<SendMessageResult | null> {
  if (!input.reporterChannel || !input.reporterPhoneE164) return null;

  const message = buildUnderReviewMessage({
    pilotAreaName: input.pilotAreaName,
    locationDetail: input.locationDetail,
    issuedAt: new Date(),
  });

  return sendToReporter(
    input.reporterChannel,
    input.reporterPhoneE164,
    pickMessageBody(message, input.language)
  );
}
