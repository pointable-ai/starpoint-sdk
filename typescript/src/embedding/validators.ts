import { EMBEDDING_MODELS } from "../common-types";

export const validateEmbeddingModel = (model: string) => {
  if (!EMBEDDING_MODELS.includes(model as any)) {
    throw new Error(
      `Invalid model: ${model}. Valid models are MINI6 and MINI12.`
    );
  }
};
