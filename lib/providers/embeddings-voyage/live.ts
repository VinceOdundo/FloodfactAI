import "server-only";
import { env } from "@/lib/config/env";
import { fetchWithTimeout } from "../shared";

interface VoyageEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

export async function embedTextLive(text: string): Promise<number[]> {
  const res = await fetchWithTimeout("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    timeoutMs: 8000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: [text], model: env.VOYAGE_MODEL, input_type: "query" }),
  });
  if (!res.ok) {
    throw new Error(`Voyage AI responded ${res.status}`);
  }
  const data = (await res.json()) as VoyageEmbeddingResponse;
  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Voyage AI returned no embedding");
  }
  return embedding;
}
