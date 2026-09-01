import { describe, expect, it } from "vitest";
import { buildAlertMessage } from "@/lib/core/alert-templates";

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
