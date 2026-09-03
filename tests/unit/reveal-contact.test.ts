import { beforeEach, describe, expect, it, vi } from "vitest";
import { revealContactForReport } from "@/lib/security/reveal-contact";

vi.mock("@/lib/config/env", () => ({
  env: { ADMIN_REVEAL_AUDIT_SALT: "test-salt" },
}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  auditInsert: vi.fn(),
}));

/** A minimal stand-in for supabase-js's query builder: chainable AND directly awaitable. */
function chain(result: unknown) {
  const obj = {
    select: () => obj,
    eq: () => obj,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
  };
  return obj;
}

let roleRowResult: { data: { role: string } | null };
let contactChannelsResult: { data: { phone_e164: string }[] | null; error: { message: string } | null };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: (table: string) => {
      if (table === "user_roles") return chain(roleRowResult);
      throw new Error(`unexpected table on session client: ${table}`);
    },
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "contact_channels") return chain(contactChannelsResult);
      if (table === "audit_events") return { insert: mocks.auditInsert };
      throw new Error(`unexpected table on service client: ${table}`);
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auditInsert.mockResolvedValue({ data: null, error: null });
});

describe("revealContactForReport", () => {
  it("rejects when there is no authenticated session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await revealContactForReport("report-1");

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mocks.auditInsert).not.toHaveBeenCalled();
  });

  it("rejects a non-admin caller without touching contact_channels", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    roleRowResult = { data: { role: "ambassador" } };

    const result = await revealContactForReport("report-1");

    expect(result).toEqual({ error: "Forbidden" });
    expect(mocks.auditInsert).not.toHaveBeenCalled();
  });

  it("returns phone numbers for an admin and writes a salted-hash audit event", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    roleRowResult = { data: { role: "admin" } };
    contactChannelsResult = { data: [{ phone_e164: "+254712345678" }], error: null };

    const result = await revealContactForReport("report-1");

    expect(result).toEqual({ phones: ["+254712345678"] });
    expect(mocks.auditInsert).toHaveBeenCalledTimes(1);

    const auditPayload = mocks.auditInsert.mock.calls[0][0];
    expect(auditPayload.action).toBe("reveal_contact");
    expect(auditPayload.actor_id).toBe("admin-1");
    expect(auditPayload.entity_id).toBe("report-1");
    // The audit trail must never carry the plaintext number back out.
    expect(JSON.stringify(auditPayload)).not.toContain("+254712345678");
    expect(auditPayload.payload.salted_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("surfaces a query error instead of returning an empty phone list silently", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    roleRowResult = { data: { role: "admin" } };
    contactChannelsResult = { data: null, error: { message: "connection reset" } };

    const result = await revealContactForReport("report-1");

    expect(result).toEqual({ error: "connection reset" });
    expect(mocks.auditInsert).not.toHaveBeenCalled();
  });
});
