import "server-only";
import { createHmac } from "node:crypto";
import { env } from "@/lib/config/env";

/**
 * Turns a phone number into a stable, non-reversible reference used for
 * dedup/corroboration (`reports.reporter_ref`, `*.recipient_ref`). The real
 * number is stored ONLY in `contact_channels`, which has no default read
 * policy — see supabase/migrations and lib/security/reveal-contact.ts.
 */
export function hashPhoneNumber(phoneE164: string): string {
  return createHmac("sha256", env.REPORT_HMAC_SECRET).update(phoneE164.trim()).digest("hex");
}
