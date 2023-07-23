import axios from "axios";
import isURL from "validator/lib/isURL";
import {
  COLLECTIONS_PATH,
  DOCUMENTS_PATH, QUERY_PATH,
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
  MISSING_COLLECTION_IDENTIFIER_ERROR,
  MISSING_COLLECTION_ID_ERROR,
  MULTIPLE_COLLECTION_IDENTIFIER_ERROR,
  NULL_COLLECTION_NAME_ERROR,
  NULL_COLLECTION_ID_ERROR
} from "./constants";

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

function _sanitizeCollectionIdentifiersInRequest<T>(request: ByWrapper<T>) {
  if ("collection_id" in request && "collection_name" in request) {
    throw new Error(
      MULTIPLE_COLLECTION_IDENTIFIER_ERROR
    );
  }
  if (!("collection_id" in request) && !("collection_name" in request)) {
    throw new Error(
      MISSING_COLLECTION_IDENTIFIER_ERROR
    );
  }
  if (
    !("collection_id" in request) &&
    "collection_name" in request &&
    !request.collection_name
  ) {
    throw new Error(NULL_COLLECTION_NAME_ERROR);
  }
  if (
    !("collection_name" in request) &&
    "collection_id" in request &&
    !request.collection_id
  ) {
    throw new Error(NULL_COLLECTION_ID_ERROR);
  }
}

function _zip<T, U>(listA: T[], listB: U[]): [T, U][] {
  const length = Math.min(listA.length, listB.length);
  const result: [T, U][] = Array.from(({length}), (_pair, index) => {
      return [listA[index], listB[index]];
    });
  return result;
}

const initialize = (
  apiKey: string,
  options?: {
    writerHostURL?: string;
    readerHostURL?: string;
  }
) => {
  axios.defaults.headers.common[API_KEY_HEADER_NAME] = apiKey;

  const writerClient = axios.create({
    baseURL: options?.writerHostURL
      ? _setAndValidateHost(options.writerHostURL)
      : WRITER_URL,
  });

  const readerClient = axios.create({
    baseURL: options?.readerHostURL
      ? _setAndValidateHost(options.readerHostURL)
      : READER_URL,
  });

  const _insertDocuments = async (
    request: InsertRequest
  ): Promise<APIResult<InsertResponse, ErrorResponse>> => {
    try {
      // sanitize request
      _sanitizeCollectionIdentifiersInRequest(request);
      if (!request.documents) {
        throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
      }
      if (
        request.documents &&
        request.documents.some((document) => !document.embedding)){
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
          throw new Error(
            CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR
          );
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
        _sanitizeCollectionIdentifiersInRequest(request);
        if (!request.documents) {
          throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
        }
        if (
          request.documents &&
          request.documents.some((document) => !document.id)
        ) {
          throw new Error(
            MISSING_DOCUMENT_ID_IN_REQUEST_ERROR
          );
        }
        if (
          request.documents &&
          request.documents.some((document) => !document.metadata)
        ) {
          throw new Error(
            MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR
          );
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
        _sanitizeCollectionIdentifiersInRequest(request);
        if (!request.ids) {
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
        _sanitizeCollectionIdentifiersInRequest(request);
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
        _sanitizeCollectionIdentifiersInRequest(request);
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
    columnInsert: async (
      request: TransposeAndInsertRequest
    ): Promise<APIResult<TransposeAndInsertResponse, ErrorResponse>> => {
      try {
        // sanitize request
        _sanitizeCollectionIdentifiersInRequest(request);

        // transpose metadata and embeddings
        const { embeddings, documentMetadata, ...rest } = request;
        const columns = _zip<number[], Value>(embeddings, documentMetadata);
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
        }
        return {
          data: null,
          error: { error_message: err.message },
        };
      }
    },
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
  metadata?: Metadata;
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
  documentMetadata: Metadata[];
}>;

export interface TransposeAndInsertResponse {
  collection_id: string;
  documents: { id: string }[];
}

// UPDATE
interface UpdateDocument {
  id: string;
  metadata: Metadata;
}

export type UpdateRequest = ByWrapper<{ documents: UpdateDocument[] }>;

export interface UpdateResponse {
  collection_id: string;
  documents: { id: string }[];
}

// DELETE
export type DeleteRequest = ByWrapper<{ ids: string[] }>;

export interface DeleteResponse {
  collection_id: string;
  document_ids: string[];
}

// QUERY
interface QueryDocuments {
  query_embedding?: number[] | undefined | null;
  sql?: string | undefined | null;
  params?: Array<string | number> | undefined | null;
}

export type QueryRequest = ByWrapper<QueryDocuments>;

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: string | undefined | null;
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

export interface ErrorResponse {
  error_message: string;
}

export interface APIResult<T, ErrorResponse> {
  data: T | null;
  error: ErrorResponse | null;
}
