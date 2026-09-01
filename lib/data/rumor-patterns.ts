import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { embedText } from "@/lib/providers/embeddings-voyage";
import type { RumorPatternSimilarityEvidence } from "@/lib/core/types";

/**
 * Semantic match via pgvector when embeddings are available; a lexical
 * substring fallback against the same canonical_claim text otherwise —
 * lower recall, but still a real, honest signal rather than "unavailable"
 * whenever a Voyage key isn't configured.
 */
export async function matchRumorPattern(rawText: string): Promise<RumorPatternSimilarityEvidence> {
  const supabase = createServiceClient();
  const embedding = await embedText(rawText);

  if (embedding) {
    const { data, error } = await supabase.rpc("match_rumor_pattern", { query_embedding: embedding });
    const match = Array.isArray(data) ? data[0] : data;
    if (!error && match) {
      return {
        source: "rumor_pattern_similarity",
        quality: "ok",
        maxSimilarity: match.similarity,
        matchedPatternCategory: match.category,
      };
    }
  }

  const { data: patterns } = await supabase.from("rumor_patterns").select("canonical_claim, category");
  const lower = rawText.toLowerCase();
  const hit = (patterns ?? []).find((p) => tokenOverlap(lower, p.canonical_claim.toLowerCase()) >= 0.4);
  if (hit) {
    return {
      source: "rumor_pattern_similarity",
      quality: "degraded",
      maxSimilarity: 0.6,
      matchedPatternCategory: hit.category,
    };
  }

  return { source: "rumor_pattern_similarity", quality: "ok", maxSimilarity: 0, matchedPatternCategory: null };
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.split(/\W+/).filter((t) => t.length > 3));
  const tokensB = new Set(b.split(/\W+/).filter((t) => t.length > 3));
  if (tokensB.size === 0) return 0;
  let shared = 0;
  for (const t of tokensB) if (tokensA.has(t)) shared++;
  return shared / tokensB.size;
}
