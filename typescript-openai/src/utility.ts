import { CreateEmbeddingRequestInput } from "openai";
import { APIResult } from "starpoint";
import axios from "axios";

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

export const handleError = (err: any): APIResult<null> => {
  if (axios.isAxiosError(err)) {
    return {
      data: null,
      error: err?.response?.data,
    };
  }
  return {
    data: null,
    error: { error_message: err.message },
  };
};
