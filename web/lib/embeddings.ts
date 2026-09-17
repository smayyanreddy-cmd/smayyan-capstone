import { pipeline, type ImageFeatureExtractionPipeline } from "@huggingface/transformers";

let extractorPromise: Promise<ImageFeatureExtractionPipeline> | null = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "image-feature-extraction",
      "Xenova/clip-vit-base-patch32"
    ) as Promise<ImageFeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function embedImage(imagePath: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(imagePath);
  const vector = Array.from(output.data as Float32Array);
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
