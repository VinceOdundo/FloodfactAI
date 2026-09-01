import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { buildAlertMessage } from "@/lib/core/alert-templates";
import type { Classification } from "@/lib/core/types";
import { sendWhatsAppMessage } from "@/lib/providers/whatsapp";
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
    const result =
      input.reporterChannel === "whatsapp"
        ? await sendWhatsAppMessage(input.reporterPhoneE164, message.en)
        : await sendSmsMessage(input.reporterPhoneE164, message.en);
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
