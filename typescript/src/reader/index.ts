import axios, { AxiosInstance } from "axios";
import {
  sanitizeCollectionIdentifiersInRequest,
  setAndValidateHost,
} from "../validators";
import { INFER_SCHEMA_PATH, QUERY_PATH, READER_URL } from "../constants";
import {
  APIResult,
  InferSchemaRequest,
  InferSchemaResponse,
  QueryRequest,
  QueryResponse,
} from "../index";
import { handleError } from "../utility";

export const initReader = (readerHostURL?: string) => {
  return axios.create({
    baseURL: readerHostURL ? setAndValidateHost(readerHostURL) : READER_URL,
  });
};

export const queryDocumentsFactory =
  (readerClient: AxiosInstance) =>
  async (request: QueryRequest): Promise<APIResult<QueryResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      // make api call
      const response = await readerClient.post<QueryResponse>(
        QUERY_PATH,
        request
      );
      return {
        data: response.data,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };

export const inferSchemaFactory =
  (readerClient: AxiosInstance) =>
  async (
    request: InferSchemaRequest
  ): Promise<APIResult<InferSchemaResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      // make api call
      const response = await readerClient.post<InferSchemaResponse>(
        INFER_SCHEMA_PATH,
        request
      );
      return {
        data: response.data,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };
