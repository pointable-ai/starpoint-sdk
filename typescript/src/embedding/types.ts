import { EMBEDDING_MODELS } from "../common-types";

export type TextEmbeddingModels = (typeof EMBEDDING_MODELS)[number];

export interface TextEmbeddingRequest {
  text: string[];
  model: TextEmbeddingModels;
}

export interface TextEmbeddingResponse {
  embeddings: number[][];
  model: TextEmbeddingModels;
}
