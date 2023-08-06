import ky from "ky-universal";
import {
  sanitizeCollectionIdentifiersInRequest,
  setAndValidateHost,
} from "../validators";
import { INFER_SCHEMA_PATH, QUERY_PATH, READER_URL } from "../constants";
import {
  InferSchemaRequest,
  InferSchemaResponse,
  QueryRequest,
  QueryResponse,
} from "./types";
import { APIResult } from "../common-types";
import { handleError } from "../utility";

export const initReader = (client: typeof ky, readerHostURL?: string) => {
  return client.create({
    prefixUrl: readerHostURL ? setAndValidateHost(readerHostURL) : READER_URL,
  });
};

export const queryDocumentsFactory =
  (readerClient: typeof ky) =>
  async (request: QueryRequest): Promise<APIResult<QueryResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      // make api call
      const response = await readerClient
        .post(QUERY_PATH, { json: request })
        .json<QueryResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };

export const inferSchemaFactory =
  (readerClient: typeof ky) =>
  async (
    request: InferSchemaRequest
  ): Promise<APIResult<InferSchemaResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      // make api call
      const response = await readerClient
        .post(INFER_SCHEMA_PATH, { json: request })
        .json<InferSchemaResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return await handleError(err);
    }
  };
