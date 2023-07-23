import axios from "axios";
import isURL from "validator/lib/isURL";

const COLLECTIONS_PATH = "/api/v1/collections";
const DOCUMENTS_PATH = "/api/v1/documents";
const QUERY_PATH = "/api/v1/query";
const INFER_SCHEMA_PATH = "/api/v1/infer_schema";

const WRITER_URL = "https://writer.starpoint.ai";
const READER_URL = "https://reader.starpoint.ai";
const API_KEY_HEADER_NAME = "x-starpoint-key";

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
      "Request has too many identifiers. Either pass in collection_id or collection_name, not both"
    );
  }
  if (!("collection_id" in request) && !("collection_name" in request)) {
    throw new Error(
      "Did not specify id or name identifier for collection in request"
    );
  }
  if (
    !("collection_id" in request) &&
    "collection_name" in request &&
    !request.collection_name
  ) {
    throw new Error("Name identifier cannot be null for collection in request");
  }
  if (
    !("collection_name" in request) &&
    "collection_id" in request &&
    !request.collection_id
  ) {
    throw new Error("Id cannot be null for collection in request");
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
      if (
        !request.documents ||
        (request.documents && request.documents.length === 0)
      ) {
        throw new Error("Did not specify documents in request");
      }
      if (
        request.documents &&
        request.documents.some((document) => !document.embedding)
      ) {
        throw new Error(
          "Did not specify an embedding for a document in the request"
        );
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
          throw new Error("Did not specify name of collection in request");
        }
        if (
          request.dimensionality === undefined ||
          request.dimensionality === null
        ) {
          throw new Error(
            "Did not specify dimensionality of collection in request"
          );
        }
        if (request.dimensionality <= 0) {
          throw new Error("Dimensionality cannot be less than or equal to 0");
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
          throw new Error("Did not specify collection_id in request");
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
        if (
          !request.documents ||
          (request.documents && request.documents.length === 0)
        ) {
          throw new Error("Did not specify documents in request");
        }
        if (
          request.documents &&
          request.documents.some((document) => !document.id)
        ) {
          throw new Error(
            "Did not specify an id for a document in the request"
          );
        }
        if (
          request.documents &&
          request.documents.some((document) => !document.metadata)
        ) {
          throw new Error(
            "Did not specify metadata for a document in the request"
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
        if (!request.ids || (request.ids && request.ids.length === 0)) {
          throw new Error("Did not specify documents to delete in request");
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
