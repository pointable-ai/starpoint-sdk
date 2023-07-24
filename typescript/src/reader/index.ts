import axios, { AxiosInstance } from "axios";
import {
  sanitizeCollectionIdentifiersInRequest,
  setAndValidateHost,
} from "../validators";
import { INFER_SCHEMA_PATH, QUERY_PATH, READER_URL } from "../constants";
import { APIResult, ErrorResponse } from "../common-types";
import {
  InferSchemaRequest,
  InferSchemaResponse,
  QueryRequest,
  QueryResponse,
} from "./types";

export const initReader = (readerHostURL?: string) => {
  return axios.create({
    baseURL: readerHostURL ? setAndValidateHost(readerHostURL) : READER_URL,
  });
};

export const queryDocumentsFactory =
  (readerClient: AxiosInstance) =>
  async (
    request: QueryRequest
  ): Promise<APIResult<QueryResponse, ErrorResponse>> => {
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
    }
  };

export const inferSchemaFactor =
  (readerClient: AxiosInstance) =>
  async (
    request: InferSchemaRequest
  ): Promise<APIResult<InferSchemaResponse, ErrorResponse>> => {
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
    }
  };
