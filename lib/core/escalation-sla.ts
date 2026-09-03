/**
 * Escalations have no reviewer SLA today — the pipeline creates one and it
 * sits `open` until an admin manually resolves it (see docs/SECURITY.md,
 * "open questions for the pilot team" — an actual response-time commitment
 * is a pilot-team policy decision, not something to invent here). This is a
 * placeholder threshold purely for *surfacing staleness*, not a promised SLA.
 */
export const ESCALATION_SLA_HOURS = 24;

export function escalationAgeMs(createdAt: string, now = Date.now()): number {
  return now - new Date(createdAt).getTime();
}

export function isEscalationBreached(createdAt: string, now = Date.now()): boolean {
  return escalationAgeMs(createdAt, now) > ESCALATION_SLA_HOURS * 60 * 60 * 1000;
}
