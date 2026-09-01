import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Verifies Meta's `X-Hub-Signature-256` header over the raw (unparsed) webhook body. */
export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return constantTimeEqual(expected, signatureHeader);
}

export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
