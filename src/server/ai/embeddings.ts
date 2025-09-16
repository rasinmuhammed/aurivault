import { pipeline, env as hfEnv } from "@xenova/transformers";

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
  // outputs.data is flat array when single input; for multiple it returns array-like
  const vectors: number[][] = Array.isArray(outputs)
    ? outputs.map((t: any) => Array.from(t.data))
    : [Array.from(outputs.data)];
  return vectors;
}

export const MINILM_DIMENSIONS = 384;


