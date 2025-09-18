import { pipeline, env as hfEnv } from "@xenova/transformers";

// Configure transformers to allow local models
hfEnv.allowLocalModels = true;

let embedderPromise: Promise<any> | null = null;

export async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

export async function embedText(texts: string[]): Promise<number[][]> {
  const embedder = await getEmbedder();
  const outputs = await embedder(texts, { pooling: "mean", normalize: true });
  
  // Handle both single and multiple inputs
  if (Array.isArray(outputs)) {
    return outputs.map((output: any) => Array.from(output.data));
  } else {
    return [Array.from(outputs.data)];
  }
}

export const MINILM_DIMENSIONS = 384;

// Utility function for cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}