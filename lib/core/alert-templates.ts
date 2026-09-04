import type { Classification } from "./types";

export interface AlertContext {
  pilotAreaName: string;
  locationDetail?: string | null;
  issuedAt: Date;
  topRationale: string[];
}

/** Everything an under-review acknowledgement needs — it carries no verdict, so no rationale. */
export type UnderReviewContext = Omit<AlertContext, "topRationale">;

export interface AlertMessage {
  en: string;
  sw: string;
}

export type MessageLanguage = "en" | "sw";

const SOURCE_LINE_EN = "Verified by FloodFact AI.";
const SOURCE_LINE_SW = "Imethibitishwa na FloodFact AI.";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
}

function formatPlace(ctx: { pilotAreaName: string; locationDetail?: string | null }): string {
  return ctx.locationDetail ? `${ctx.locationDetail}, ${ctx.pilotAreaName}` : ctx.pilotAreaName;
}

/**
 * Which language to send an outbound message in, given whatever the NLU step
 * detected (`nlu_extractions.language`, a free-form string from the model).
 *
 * Unknown resolves to Swahili rather than English on purpose: the Phase-1
 * pilot wards are Swahili/Sheng dominant, so an unrecognised or missing value
 * is far more likely to be a Swahili variant than an English one — and the
 * failure that actually matters is a flood warning the recipient cannot read.
 */
export function resolveMessageLanguage(detected: string | null | undefined): MessageLanguage {
  if (!detected) return "sw";
  return detected.trim().toLowerCase().startsWith("en") ? "en" : "sw";
}

export function pickMessageBody(message: AlertMessage, language: MessageLanguage): string {
  return language === "sw" ? message.sw : message.en;
}

/**
 * Builds the outbound WhatsApp/SMS text for a classification, satisfying the
 * minimum-content rules in SRS §14. Exact wording, evacuation destinations,
 * and emergency contacts still need sign-off from local emergency
 * stakeholders before live use (§14) — these templates are the structural
 * baseline, not final approved copy.
 */
export function buildAlertMessage(classification: Classification, ctx: AlertContext): AlertMessage {
  const place = formatPlace(ctx);
  const time = formatTime(ctx.issuedAt);

  switch (classification) {
    case "verified_warning":
      return {
        en:
          `VERIFIED FLOOD WARNING — ${place}. Water is rising. Move to higher ground now and avoid low-lying paths and river crossings. ` +
          `${SOURCE_LINE_EN} Evidence: ${ctx.topRationale.slice(0, 2).join(" ")} Issued ${time}.`,
        sw:
          `ONYO LILILOTHIBITISHWA LA MAFURIKO — ${place}. Maji yanapanda. Hamia mahali pa juu sasa na epuka njia za chini na maeneo ya kuvuka mto. ` +
          `${SOURCE_LINE_SW} Saa: ${time}.`,
      };

    case "elevated_risk":
      return {
        en:
          `ELEVATED FLOOD RISK — ${place}. Conditions could worsen. Keep valuables off the floor, watch for updates, and stay ready to move. ` +
          `${SOURCE_LINE_EN} Evidence: ${ctx.topRationale.slice(0, 2).join(" ")} Issued ${time}.`,
        sw:
          `HATARI YA MAFURIKO INAYOONGEZEKA — ${place}. Hali inaweza kuzidi kuwa mbaya. Weka vitu vyako mahali pa juu na fuatilia taarifa zaidi. ` +
          `${SOURCE_LINE_SW} Saa: ${time}.`,
      };

    case "false_information":
      return {
        en:
          `This claim about ${place} is FALSE — current evidence does not support it. Please do not reshare it. ` +
          `${SOURCE_LINE_EN} Issued ${time}.`,
        sw:
          `Madai kuhusu ${place} SI KWELI — ushahidi wa sasa hauunga mkono taarifa hii. Tafadhali usisambaze tena. ` +
          `${SOURCE_LINE_SW} Saa: ${time}.`,
      };
  }
}

/**
 * Sent when the engine could not reach a confident verdict and the report went
 * to a human instead. Before this existed, the escalation path returned
 * without messaging anyone, so the reporter got silence on exactly the cases
 * still being decided.
 *
 * Deliberately NOT an alert: it carries no verdict, so it must never create an
 * `alerts` row — those feed the public alert feed and the ambassador queue.
 *
 * It also states no response time. `ESCALATION_SLA_HOURS` is explicitly a
 * staleness threshold, not a commitment (see lib/core/escalation-sla.ts), and
 * an actual response-time promise is a pilot-team policy decision — not
 * something to invent in a message template. Say a human is looking; don't
 * promise a clock we haven't agreed to.
 */
export function buildUnderReviewMessage(ctx: UnderReviewContext): AlertMessage {
  const place = formatPlace(ctx);
  const time = formatTime(ctx.issuedAt);

  return {
    en:
      `FloodFact AI received your report about ${place}. We could not confirm it automatically, so a trained ` +
      `community ambassador is checking it now. We will message you with the result. Avoid flowing water and ` +
      `low-lying paths until then. Received ${time}.`,
    sw:
      `FloodFact AI imepokea ripoti yako kuhusu ${place}. Hatukuweza kuithibitisha moja kwa moja, kwa hivyo ` +
      `msaidizi wa jamii aliyefunzwa anaiangalia sasa. Tutakutumia jibu. Epuka maji yanayotiririka na njia za ` +
      `chini hadi hapo. Imepokelewa ${time}.`,
  };
}
