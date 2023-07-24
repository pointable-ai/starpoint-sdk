import { CreateEmbeddingRequestInput } from "openai";

export const backfillDocumentMetadata = (
  inputData: CreateEmbeddingRequestInput
) => {
  if (typeof inputData === "string") {
    return [{ input: inputData }];
  } else {
    return inputData.map((data) => {
      return {
        input: data,
      };
    });
  }
};
