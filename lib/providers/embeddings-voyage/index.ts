import "server-only";
import { providerMode } from "@/lib/config/env";
import { recordSourceHealth } from "@/lib/data/source-health";
import { embedTextLive } from "./live";

/**
 * Returns null (never a fabricated vector) whenever a real embedding isn't
 * available — sandbox mode or a live-call failure. Callers (see
 * lib/data/rumor-patterns.ts) fall back to lexical matching against
 * rumor_patterns.canonical_claim when this returns null, rather than
 * pretending semantic search ran.
 */
export async function embedText(text: string): Promise<number[] | null> {
  if (providerMode.embeddings() === "sandbox") {
    return null;
  }
  try {
    const embedding = await embedTextLive(text);
    await recordSourceHealth("embeddings_voyage", "live", { ok: true });
    return embedding;
  } catch (error) {
    await recordSourceHealth("embeddings_voyage", "live", { ok: false, error });
    return null;
  }
}
