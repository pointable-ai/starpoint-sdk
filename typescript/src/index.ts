import axios, { AxiosError } from "axios";
import isURL from "validator/lib/isURL";

const DOCUMENTS_PATH = "/api/v1/documents";
const QUERY_PATH = "/api/v1/query";

const COMPOSER_URL = "https://composer.envelope.ai/api/v1";
const READER_URL = "http://localhost:9000/";
const API_KEY_HEADER_NAME = "x-envelope-key";

const _setAndValidateHost = (host: string) => {
  if (!host) {
    throw new Error("No host value provided. A host must be provided.");
  } else if (
    !isURL(host, {
      require_tld: false,
      require_protocol: false,
      require_host: false,
      require_port: false,
      require_valid_protocol: false,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      allow_fragments: false,
      allow_query_components: true,
      disallow_auth: false,
      validate_length: false,
    })
  ) {
    throw new Error(`Provided host ${host} is not a valid URL format.`);
  }
  const trimmed_hostname = host.replace(/\/$/, ""); // Remove trailing slashes from the host URL

  return trimmed_hostname;
};

const initialize = (
  apiKey: string,
  composerHostURL?: string,
  readerHostURL?: string
) => {
  axios.defaults.headers.common[API_KEY_HEADER_NAME] = apiKey;

  const composerClient = axios.create({
    baseURL: composerHostURL
      ? _setAndValidateHost(composerHostURL)
      : COMPOSER_URL,
  });

  const readerClient = axios.create({
    baseURL: readerHostURL ? _setAndValidateHost(readerHostURL) : READER_URL,
  });

  return {
    insert: async (request: InsertRequest) => {
      try {
        const response = await composerClient.post<InsertResponse>(
          DOCUMENTS_PATH,
          request
        );
        const result: APIResult<InsertResponse> = {
          data: response.data, 
          error: null
        }
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error(
            `Request failed with status code ${err?.response?.status} and the following message:\n${err?.response?.data}`
          );
          const result: APIResult<InsertResponse> = {
            data: null,
            error: err?.response?.data
          }
          return result;
        } else {
          throw new Error("different error than axios");
        }
      }
    },
    update: async (request: UpdateRequest) => {
      try {
        const response = await composerClient.patch<UpdateResponse>(
          DOCUMENTS_PATH,
          request
        );
        const result: APIResult<UpdateResponse> = {
          data: response.data, 
          error: null
        }
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error(
            `Request failed with status code ${err?.response?.status} and the following message:\n${err?.response?.data}`
          );
          const result: APIResult<UpdateResponse> = {
            data: null,
            error: err?.response?.data
          }
          return result;
        } else {
          throw new Error("different error than axios");
        }
      }
    },
    delete: async (request: DeleteRequest) => {
      try {
        const response = await composerClient.delete<DeleteResponse>(
          DOCUMENTS_PATH,
          {
            data: request,
          }
        );
        const result: APIResult<DeleteResponse> = {
          data: response.data, 
          error: null
        }
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error(
            `Request failed with status code ${err?.response?.status} and the following message:\n${err?.response?.data}`
          );
          const result: APIResult<DeleteResponse> = {
            data: null,
            error: err?.response?.data
          }
          return result;
        } else {
          throw new Error("different error than axios");
        }
      }
    },
    query: async (request: QueryRequest) => {
      try {
        const response = await readerClient.post<QueryResponse>(
          QUERY_PATH,
          request
        );
        const result: APIResult<QueryResponse> = {
          data: response.data, 
          error: null
        }
        return result;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error(
            `Request failed with status code ${err?.response?.status} and the following message:\n${err?.response?.data}`
          );
          const result: APIResult<QueryResponse> = {
            data: null,
            error: err?.response?.data
          }
          return result;
        } else {
          throw new Error("different error than axios");
        }
      }
    },
  };
};

export default initialize;

// INSERT TYPES
interface InsertDocumentsDocument {
  embedding: number[];
  metadata: Metadata;
}

interface InsertDocuments {
  documents: InsertDocumentsDocument[];
}

export type InsertRequest = ByWrapper<InsertDocuments>;

export interface InsertResponse {
  collection_id: string;
  documents: { id: string };
}

// UPDATE TYPES
interface UpdateDocument {
  id: string;
  metadata: Metadata;
}

export type UpdateRequest = ByWrapper<{ documents: UpdateDocument[] }>;

export interface UpdateResponse {
  collection_id: string;
  documents: { id: string }[];
}

// DELETE TYPES
export type DeleteRequest = ByWrapper<{ ids: string[] }>;

export interface DeleteResponse {
  collection_id: string;
  document_ids: string[];
}

// QUERY TYPES
interface QueryDocuments {
  query_embedding?: number[] | undefined | null;
  sql?: string | undefined | null;
}

export type QueryRequest = ByWrapper<QueryDocuments>;

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: string | undefined | null;
  results: {
    "__id": string;
    "__distance": number;
    [key: string]: string | number | undefined | null;
  }[];
}

interface ByCollectionName {
  collection_name: string;
}

type ByCollectionNameWrapper<T> = T & ByCollectionName;

interface ByCollectionId {
  collection_id: string;
}

type ByCollectionIdWrapper<T> = T & ByCollectionId;

type ByWrapper<T> = ByCollectionNameWrapper<T> | ByCollectionIdWrapper<T>;

type Metadata = Value | undefined | null;

interface Value {
  [key: string]: string | number;
}

export interface APIResult<T> {
  data: T | null;
  error: string | null;
}
