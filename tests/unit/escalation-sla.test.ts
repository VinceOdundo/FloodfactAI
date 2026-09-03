import { describe, expect, it } from "vitest";
import { ESCALATION_SLA_HOURS, escalationAgeMs, isEscalationBreached } from "@/lib/core/escalation-sla";

describe("escalationAgeMs", () => {
  it("computes elapsed time relative to a fixed now", () => {
    const now = Date.parse("2026-01-02T00:00:00Z");
    const createdAt = "2026-01-01T00:00:00Z";
    expect(escalationAgeMs(createdAt, now)).toBe(24 * 60 * 60 * 1000);
  });
});

describe("isEscalationBreached", () => {
  const now = Date.parse("2026-01-02T00:00:00Z");

  it("is false just under the threshold", () => {
    const createdAt = new Date(now - (ESCALATION_SLA_HOURS * 60 * 60 * 1000 - 1)).toISOString();
    expect(isEscalationBreached(createdAt, now)).toBe(false);
  });

  it("is true just over the threshold", () => {
    const createdAt = new Date(now - (ESCALATION_SLA_HOURS * 60 * 60 * 1000 + 1)).toISOString();
    expect(isEscalationBreached(createdAt, now)).toBe(true);
  });
});
