/**
 * Backfills `rumor_patterns.embedding` for rows seeded with a null vector
 * (see supabase/seed.sql — never fabricated at seed time). Safe to re-run;
 * only processes rows still missing an embedding. Requires VOYAGE_API_KEY.
 *
 * Deliberately self-contained (reads process.env directly, makes its own
 * HTTP/Supabase calls) rather than importing lib/config/env.ts or
 * lib/providers/embeddings-voyage: those are marked `server-only`, a guard
 * against them ever reaching a client bundle inside the Next.js app, which
 * has nothing to check for a standalone script run via `tsx` outside
 * Next's build — so it throws unconditionally instead. A few lines of
 * duplication here is cheaper than weakening that guard for the app itself.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL ?? "voyage-3.5";

async function embed(text: string): Promise<number[] | null> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${VOYAGE_API_KEY}` },
    body: JSON.stringify({ input: [text], model: VOYAGE_MODEL, input_type: "query" }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data?.[0]?.embedding ?? null;
}

async function main() {
  if (!VOYAGE_API_KEY) {
    console.log(
      "VOYAGE_API_KEY is not set — nothing to backfill (rumor matching runs in lexical-fallback mode). See docs/SETUP.md."
    );
    return;
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log("Supabase is not configured (DEMO_MODE has no real rumor_patterns table to backfill).");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: rows, error } = await supabase
    .from("rumor_patterns")
    .select("id, canonical_claim")
    .is("embedding", null);
  if (error) throw new Error(error.message);

  console.log(`Backfilling ${rows?.length ?? 0} rumor pattern(s)...`);
  for (const row of rows ?? []) {
    const embedding = await embed(row.canonical_claim);
    if (!embedding) {
      console.warn(`  Skipped "${row.canonical_claim}" — embedding call failed.`);
      continue;
    }
    const { error: updateError } = await supabase
      .from("rumor_patterns")
      .update({ embedding: embedding as unknown as string })
      .eq("id", row.id);
    console.log(
      updateError ? `  Failed to save "${row.canonical_claim}": ${updateError.message}` : `  Embedded "${row.canonical_claim}"`
    );
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
