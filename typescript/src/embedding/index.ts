import ky from "ky-universal";
import { setAndValidateHost } from "../validators";
import { EMBEDDING_URL, EMBED_PATH } from "../constants";
import { APIResult } from "../common-types";
import { TextEmbeddingRequest, TextEmbeddingResponse } from "./types";
import { validateEmbeddingModel } from "./validators";
import { handleError } from "../utility";

export const initEmbedding = (client: typeof ky, embeddingHostURL?: string) => {
  return client.create({
    prefixUrl: embeddingHostURL
      ? setAndValidateHost(embeddingHostURL)
      : EMBEDDING_URL,
  });
};

export const embedFactory =
  (embeddingClient: typeof ky) =>
  async (
    req: TextEmbeddingRequest
  ): Promise<APIResult<TextEmbeddingResponse>> => {
    try {
      // sanitize request
      validateEmbeddingModel(req.model);
      // make api call
      const response = await embeddingClient
        .post(EMBED_PATH, { json: req })
        .json<TextEmbeddingResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return await handleError(err);
    }
  };
