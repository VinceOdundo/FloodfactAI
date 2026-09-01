import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPhoneNumber } from "@/lib/security/hashing";
import { constantTimeEqual, verifyMetaWebhookSignature } from "@/lib/security/hmac";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("hashPhoneNumber", () => {
  it("is deterministic for the same input", () => {
    expect(hashPhoneNumber("+254712345678")).toBe(hashPhoneNumber("+254712345678"));
  });

  it("produces different hashes for different numbers", () => {
    expect(hashPhoneNumber("+254712345678")).not.toBe(hashPhoneNumber("+254712345679"));
  });

  it("never returns the plaintext number", () => {
    expect(hashPhoneNumber("+254712345678")).not.toContain("254712345678");
  });
});

describe("verifyMetaWebhookSignature", () => {
  const secret = "test-app-secret";
  const body = JSON.stringify({ hello: "world" });

  it("accepts a correctly-signed body", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyMetaWebhookSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyMetaWebhookSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const sig = "sha256=" + createHmac("sha256", "wrong-secret").update(body).digest("hex");
    expect(verifyMetaWebhookSignature(body, sig, secret)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyMetaWebhookSignature(body, null, secret)).toBe(false);
  });
});

describe("constantTimeEqual", () => {
  it("returns true only for exactly equal strings", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("allows the first N requests then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key).allowed).toBe(true);
    }
    const sixth = checkRateLimit(key);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks independent keys separately", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(a);
    expect(checkRateLimit(a).allowed).toBe(false);
    expect(checkRateLimit(b).allowed).toBe(true);
  });
});
