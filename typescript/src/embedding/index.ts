import axios, { AxiosInstance } from "axios";
import { setAndValidateHost } from "../validators";
import { EMBEDDING_URL, EMBED_PATH } from "../constants";
import {  APIResult,
  ErrorResponse,
} from "../common-types"
import {
  TextEmbeddingRequest,
  TextEmbeddingResponse,
} from "./types";
import { validateEmbeddingModel } from "./validators";
import { handleError } from "../utility";

export const initEmbedding = (embeddingHostURL?: string) => {
  return axios.create({
    baseURL: embeddingHostURL
      ? setAndValidateHost(embeddingHostURL)
      : EMBEDDING_URL,
  });
};

export const embedFactory =
  (embeddingClient: AxiosInstance) =>
  async (
    req: TextEmbeddingRequest
  ): Promise<APIResult<TextEmbeddingResponse>> => {
    try {
      // sanitize request
      validateEmbeddingModel(req.model);
      // make api call
      const response = await embeddingClient.post<TextEmbeddingResponse>(
        EMBED_PATH,
        req
      );
      return {
        data: response.data,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };
