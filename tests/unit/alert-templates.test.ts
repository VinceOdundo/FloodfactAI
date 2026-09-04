import { describe, expect, it } from "vitest";
import {
  buildAlertMessage,
  buildUnderReviewMessage,
  pickMessageBody,
  resolveMessageLanguage,
} from "@/lib/core/alert-templates";

const ctx = {
  pilotAreaName: "Mukuru kwa Reuben",
  locationDetail: "Kanini Road",
  issuedAt: new Date("2026-04-15T02:00:00Z"),
  topRationale: ["Rainfall reading corresponds to 128% of the high-intensity threshold."],
};

describe("buildAlertMessage", () => {
  it("verified_warning includes area, an immediate action, evidence, source identity, and time", () => {
    const msg = buildAlertMessage("verified_warning", ctx);
    expect(msg.en).toContain("Kanini Road");
    expect(msg.en).toContain("Mukuru kwa Reuben");
    expect(msg.en).toMatch(/move|higher ground/i);
    expect(msg.en).toContain("FloodFact AI");
    expect(msg.en).toMatch(/\d{2}:\d{2}/);
    expect(msg.sw).toContain("FloodFact AI");
  });

  it("elevated_risk includes a precautionary action and monitoring guidance", () => {
    const msg = buildAlertMessage("elevated_risk", ctx);
    expect(msg.en).toMatch(/watch|monitor|ready/i);
    expect(msg.en).toContain("FloodFact AI");
  });

  it("false_information states the claim is false and instructs not to reshare", () => {
    const msg = buildAlertMessage("false_information", ctx);
    expect(msg.en).toMatch(/FALSE/);
    expect(msg.en).toMatch(/not reshare|do not reshare/i);
    expect(msg.sw).toMatch(/SI KWELI/);
  });

  it("falls back to the area name alone when no specific location detail is known", () => {
    const msg = buildAlertMessage("verified_warning", { ...ctx, locationDetail: null });
    expect(msg.en).toContain("Mukuru kwa Reuben");
    expect(msg.en).not.toContain("Kanini Road");
  });
});

describe("buildUnderReviewMessage", () => {
  const reviewCtx = { pilotAreaName: "Mukuru kwa Reuben", locationDetail: "Kanini Road", issuedAt: ctx.issuedAt };

  it("confirms receipt and says a human is checking, in both languages", () => {
    const msg = buildUnderReviewMessage(reviewCtx);
    expect(msg.en).toContain("Kanini Road");
    expect(msg.en).toMatch(/received your report/i);
    expect(msg.en).toMatch(/ambassador/i);
    expect(msg.sw).toMatch(/imepokea/i);
    expect(msg.sw).toMatch(/msaidizi/i);
  });

  it("states no verdict — it must never read as a confirmation or a dismissal", () => {
    const msg = buildUnderReviewMessage(reviewCtx);
    expect(msg.en).not.toMatch(/VERIFIED|FALSE|WARNING/);
    expect(msg.sw).not.toMatch(/ONYO|SI KWELI/);
  });

  it("promises no response time — an SLA is a pilot-team decision, not a template's", () => {
    const msg = buildUnderReviewMessage(reviewCtx);
    expect(msg.en).not.toMatch(/\d+\s*(minute|min|hour|hr)/i);
    expect(msg.sw).not.toMatch(/\d+\s*(dakika|saa)/i);
  });
});

describe("resolveMessageLanguage", () => {
  it("uses English only when English is actually detected", () => {
    expect(resolveMessageLanguage("en")).toBe("en");
    expect(resolveMessageLanguage("en-KE")).toBe("en");
    expect(resolveMessageLanguage("English")).toBe("en");
  });

  it("resolves Swahili and its variants to Swahili", () => {
    expect(resolveMessageLanguage("sw")).toBe("sw");
    expect(resolveMessageLanguage("swa")).toBe("sw");
    expect(resolveMessageLanguage("sw-KE")).toBe("sw");
  });

  it("defaults unknown or missing detection to Swahili, not English", () => {
    expect(resolveMessageLanguage(null)).toBe("sw");
    expect(resolveMessageLanguage(undefined)).toBe("sw");
    expect(resolveMessageLanguage("")).toBe("sw");
    expect(resolveMessageLanguage("sheng")).toBe("sw");
  });
});

describe("pickMessageBody", () => {
  it("selects the requested language's body", () => {
    const msg = buildAlertMessage("verified_warning", ctx);
    expect(pickMessageBody(msg, "sw")).toBe(msg.sw);
    expect(pickMessageBody(msg, "en")).toBe(msg.en);
  });
});
