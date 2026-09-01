import type { Classification } from "./types";

export interface AlertContext {
  pilotAreaName: string;
  locationDetail?: string | null;
  issuedAt: Date;
  topRationale: string[];
}

export interface AlertMessage {
  en: string;
  sw: string;
}

const SOURCE_LINE_EN = "Verified by FloodFact AI.";
const SOURCE_LINE_SW = "Imethibitishwa na FloodFact AI.";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
}

/**
 * Builds the outbound WhatsApp/SMS text for a classification, satisfying the
 * minimum-content rules in SRS §14. Exact wording, evacuation destinations,
 * and emergency contacts still need sign-off from local emergency
 * stakeholders before live use (§14) — these templates are the structural
 * baseline, not final approved copy.
 */
export function buildAlertMessage(classification: Classification, ctx: AlertContext): AlertMessage {
  const place = ctx.locationDetail ? `${ctx.locationDetail}, ${ctx.pilotAreaName}` : ctx.pilotAreaName;
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
