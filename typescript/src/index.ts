import axios from "axios";
import isURL from "validator/lib/isURL";
import {
  Configuration,
  OpenAIApi,
  CreateEmbeddingRequestInput,
  CreateEmbeddingResponse,
} from "openai";
import {
  COLLECTIONS_PATH,
  DOCUMENTS_PATH,
  QUERY_PATH,
  INFER_SCHEMA_PATH,
  WRITER_URL,
  READER_URL,
  API_KEY_HEADER_NAME,
  MISSING_EMBEDDING_IN_DOCUMENT_ERROR,
  MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR,
  MISSING_DOCUMENT_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
  CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR,
  CREATE_COLLECTION_MISSING_NAME_ERROR,
  CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR,
  MISSING_COLLECTION_ID_ERROR,
} from "./constants";
import {
  sanitizeCollectionIdentifiersInRequest,
  setAndValidateHost,
} from "./validators";
import { zip } from "./utility";
import { OPENAI_INSTANCE_INIT_ERROR } from "./open-ai/constants";
import { backfillDocumentMetadata } from "./open-ai/utility";
import { sanitizeInitOpenAIRequest } from "./open-ai/validators";
import {
  APIResult,
  ByWrapper,
  ErrorResponse,
  Option,
  Metadata,
} from "./common-types";
import { buildAndInsertEmbeddingsFromOpenAI } from "./open-ai";

const initialize = (
  apiKey: string,
  options?: {
    writerHostURL?: string;
    readerHostURL?: string;
    openaiKey?: string;
  }
) => {
  axios.defaults.headers.common[API_KEY_HEADER_NAME] = apiKey;

  const writerClient = axios.create({
    baseURL: options?.writerHostURL
      ? setAndValidateHost(options.writerHostURL)
      : WRITER_URL,
  });

  const readerClient = axios.create({
    baseURL: options?.readerHostURL
      ? setAndValidateHost(options.readerHostURL)
      : READER_URL,
  });

  let openAIApiClient: OpenAIApi | null = null;

  const _insertDocuments = async (
    request: InsertRequest
  ): Promise<APIResult<InsertResponse, ErrorResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      if (
        !request.documents ||
        (request.documents && request.documents.length === 0)
      ) {
        throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
      }
      if (
        request.documents &&
        request.documents.some(
          (document) =>
            !document.embedding ||
            (document.embedding && document.embedding.length === 0)
        )
      ) {
        throw new Error(MISSING_EMBEDDING_IN_DOCUMENT_ERROR);
      }
      // make api call
      const response = await writerClient.post<InsertResponse>(
        DOCUMENTS_PATH,
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

  const _columnInsert = async (
    request: TransposeAndInsertRequest
  ): Promise<APIResult<TransposeAndInsertResponse, ErrorResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);

      // transpose metadata and embeddings
      const { embeddings, document_metadata, ...rest } = request;
      const columns = zip(embeddings, document_metadata);
      const documents: Document[] = columns.map((column) => {
        const [embedding, metadata] = column;

        return {
          embedding,
          metadata,
        };
      });

      const insertRequest: InsertRequest = {
        ...rest,
        documents,
      };

      return _insertDocuments(insertRequest);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return {
          data: null,
          error: err?.response?.data,
        };
      } else {
        return {
          data: null,
          error: { error_message: err.message },
        };
      }
    }
  };

  return {
    createCollection: async (
      request: CreateCollectionRequest
    ): Promise<APIResult<CreateCollectionResponse, ErrorResponse>> => {
      try {
        // sanitize request
        if (!request.name) {
          throw new Error(CREATE_COLLECTION_MISSING_NAME_ERROR);
        }
        if (
          request.dimensionality === undefined ||
          request.dimensionality === null
        ) {
          throw new Error(CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR);
        }
        if (request.dimensionality <= 0) {
          throw new Error(CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR);
        }

        // make api call
        const response = await writerClient.post<CreateCollectionResponse>(
          COLLECTIONS_PATH,
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
    },
    deleteCollection: async (
      request: DeleteCollectionRequest
    ): Promise<APIResult<DeleteCollectionResponse, ErrorResponse>> => {
      try {
        if (!request.collection_id) {
          throw new Error(MISSING_COLLECTION_ID_ERROR);
        }
        // make api call
        const response = await writerClient.delete<DeleteCollectionResponse>(
          COLLECTIONS_PATH,
          {
            data: request,
          }
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
    },
    insertDocuments: _insertDocuments,
    updateDocuments: async (
      request: UpdateRequest
    ): Promise<APIResult<UpdateResponse, ErrorResponse>> => {
      try {
        // sanitize request
        sanitizeCollectionIdentifiersInRequest(request);
        if (
          !request.documents ||
          (request.documents && request.documents.length === 0)
        ) {
          throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
        }
        if (
          request.documents &&
          request.documents.some((document) => !document.id)
        ) {
          throw new Error(MISSING_DOCUMENT_ID_IN_REQUEST_ERROR);
        }
        if (
          request.documents &&
          request.documents.some(
            (document) =>
              !document.metadata ||
              (document.metadata && document.metadata.length === 0)
          )
        ) {
          throw new Error(MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR);
        }
        // make api call
        const response = await writerClient.patch<UpdateResponse>(
          DOCUMENTS_PATH,
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
    },
    deleteDocuments: async (
      request: DeleteRequest
    ): Promise<APIResult<DeleteResponse, ErrorResponse>> => {
      try {
        // sanitize request
        sanitizeCollectionIdentifiersInRequest(request);
        if (!request.ids || (request.ids && request.ids.length === 0)) {
          throw new Error(MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR);
        }
        // make api call
        const response = await writerClient.delete<DeleteResponse>(
          DOCUMENTS_PATH,
          {
            data: request,
          }
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
    },
    queryDocuments: async (
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
    },
    inferSchema: async (
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
    },
    columnInsert: _columnInsert,
  };
};

export const db = {
  initialize,
};

// COLLECTION TYPES
// CREATE
export interface CreateCollectionRequest {
  name: string;
  dimensionality: number;
}

export interface CreateCollectionResponse {
  id: string;
  name: string;
  dimensionality: number;
}

// DELETE
export interface DeleteCollectionRequest {
  collection_id: string;
}

export interface DeleteCollectionResponse {
  success: boolean;
}

// DOCUMENT TYPES
// INSERT
interface Document {
  embedding: number[];
  metadata?: Option<Metadata>;
}

interface InsertDocuments {
  documents: Document[];
}

export type InsertRequest = ByWrapper<InsertDocuments>;

export interface InsertResponse {
  collection_id: string;
  documents: { id: string }[];
}

export type TransposeAndInsertRequest = ByWrapper<{
  embeddings: number[][];
  document_metadata: Metadata[];
}>;

export interface TransposeAndInsertResponse {
  collection_id: string;
  documents: { id: string }[];
}

// QUERY
interface QueryDocuments {
  query_embedding?: Option<number[]>;
  sql?: Option<string>;
  params?: Option<Array<string | number>>;
}

export type QueryRequest = ByWrapper<QueryDocuments>;

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: Option<string>;
  results: {
    __id: string;
    __distance: number;
    [key: string]: string | number | undefined | null;
  }[];
}

// INFER SCHEMA
export enum InferredType {
  String,
  Number,
  Boolean,
  Array,
  Object,
}
interface InferredSchema {
  types: Record<string, InferredType[]>;
  nullability: Record<string, boolean>;
}

export type InferSchemaRequest = ByWrapper<{}>;

export interface InferSchemaResponse {
  inferred_schema: InferredSchema;
}

// OPENAI
export interface InitOpenAIRequest {
  openai_key?: Option<string>;
  openai_key_filepath?: Option<string>;
}

export interface InitOpenAIResponse {
  success: boolean;
}

export type BuildAndInsertEmbeddingsRequest = ByWrapper<{
  input_data: CreateEmbeddingRequestInput;
}>;

export type BuildAndInsertEmbeddingsFromOpenAIRequest = ByWrapper<{
  model: string;
  input_data: CreateEmbeddingRequestInput;
  document_metadata?: Option<Metadata[]>;
  openai_user?: Option<string>;
}>;

export interface BuildAndInsertEmbeddingsFromOpenAIResponse {
  openai_response: CreateEmbeddingResponse;
  starpoint_response: InsertResponse;
}
