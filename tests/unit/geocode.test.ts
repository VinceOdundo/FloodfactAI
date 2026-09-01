import { describe, expect, it } from "vitest";
import { matchPilotAreaSlug } from "@/lib/core/geocode";

describe("matchPilotAreaSlug", () => {
  it("matches a known landmark inside a longer message", () => {
    expect(matchPilotAreaSlug("Water is rising fast near the railway crossing on Kanini Road")).toBe(
      "mukuru-kwa-reuben"
    );
  });

  it("matches Swahili-language mentions of a sub-area", () => {
    expect(matchPilotAreaSlug("Nimesikia wanasema dam imepasuka karibu na Njenga")).toBe("mukuru-kwa-njenga");
  });

  it("is case-insensitive", () => {
    expect(matchPilotAreaSlug("VIWANDANI near Likoni Road")).toBe("viwandani");
  });

  it("prefers the longer, more specific alias when multiple could match", () => {
    // "kwa reuben" should win over any shorter, unrelated substring collisions.
    expect(matchPilotAreaSlug("I am in Mukuru kwa Reuben right now")).toBe("mukuru-kwa-reuben");
  });

  it("returns null for text with no known landmark", () => {
    expect(matchPilotAreaSlug("Is it safe to walk outside tonight?")).toBeNull();
  });

  it("returns null for empty or missing input", () => {
    expect(matchPilotAreaSlug("")).toBeNull();
    expect(matchPilotAreaSlug(null)).toBeNull();
    expect(matchPilotAreaSlug(undefined)).toBeNull();
  });
});
