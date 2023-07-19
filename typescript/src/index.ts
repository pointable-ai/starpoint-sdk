import axios from "axios";
import isURL from "validator/lib/isURL";
import { Configuration, OpenAIApi, CreateEmbeddingRequestInput, CreateEmbeddingResponse } from "openai"
import fs from "fs";
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

 const _sanitizeInitOpenAIRequest = async (request: InitOpenAIRequest) => {
  const fileStats = await fs.promises.stat(request.openai_key_filepath)

  if ("openai_key" in request && "openai_key_filepath" in request) {
    throw new Error(
      "Request has too many identifiers. Either pass in openai_key or openai_key_filepath, not both"
    );
  }
  if (!("openai_key" in request) && !("openai_key_filepath" in request)) {
    throw new Error(
      "Did not specify openai_key or openai_key_filepath in request"
    );
  }
  if (
    !("openai_key_filepath" in request) &&
    "openai_key" in request &&
    !request.openai_key
  ) {
    throw new Error("OpenAI key cannot be null in request");
  }
  if (
    !("openai_key" in request) &&
    "openai_key_filepath" in request &&
    !request.openai_key_filepath
  ) {
    throw new Error("OpenAI key filepath cannot be null in request");
  }
  if (
    !("openai_key" in request) &&
    "openai_key_filepath" in request &&
    request.openai_key_filepath &&
    fileStats.isFile()
  ) {
    throw new Error("OpenAI key filepath must be a file in request");
  }
}

const _backfillDocumentMetadata = (inputData: string | any[] | string[] | number[]) => {
  if (typeof(inputData) === "string"){
    return [{"input": inputData}]
  }
  else {
    return inputData.map((data) => {
      return {
        "input": data
      }
    });
  }
}

function _zip<T, U>(listA: T[], listB: U[]): [T, U][] {
  const length = Math.min(listA.length, listB.length);

  return Array(length).map((_pair, index) => {
    return [listA[index], listB[index]];
  });
}

const initialize = (
  apiKey: string,
  writerHostURL?: string,
  readerHostURL?: string,
) => {
  axios.defaults.headers.common[API_KEY_HEADER_NAME] = apiKey;

  const writerClient = axios.create({
    baseURL: writerHostURL ? _setAndValidateHost(writerHostURL) : WRITER_URL,
  });

  const readerClient = axios.create({
    baseURL: readerHostURL ? _setAndValidateHost(readerHostURL) : READER_URL,
  });

  let openAIApiClient: OpenAIApi | null = null;

  const _insertDocument = async (request: InsertRequest) => {
    try {
      // sanitize request
      _sanitizeCollectionIdentifiersInRequest(request);
      if (!request.documents) {
        throw new Error(
          "Did not specify documents to insert into collection in request"
        );
      }
      if (
        request.documents &&
        request.documents.some((document) => !document.embedding)
      ) {
        throw new Error(
          "Did not specify an embedding for a document in the request"
        );
      }
      if (
        request.documents &&
        request.documents.some(
          (document) => typeof document.embedding !== "number"
        )
      ) {
        throw new Error(
          "One of the embeddings for a document contains an invalid number"
        );
      }
      // make api call
      const response = await writerClient.post<InsertResponse>(
        DOCUMENTS_PATH,
        request
      );
      const result: APIResult<InsertResponse, ErrorResponse> = {
        data: response.data,
        error: null,
      };
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const result: APIResult<InsertResponse, ErrorResponse> = {
          data: null,
          error: error?.response?.data,
        };
        return result;
      } else {
        throw error;
      }
    }
  };

  const _columnInsert = async (request: TransposeAndInsertRequest) => {
    try {
      // sanitize request
      _sanitizeCollectionIdentifiersInRequest(request);

      // transpose metadata and embeddings
      const { embeddings, documentMetadata, ...rest } = request;
      const columns = _zip(embeddings, documentMetadata);
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

      return _insertDocument(insertRequest);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const result: APIResult<TransposeAndInsertResponse, ErrorResponse> = {
          data: null,
          error: error?.response?.data,
        };
        return result;
      } else {
        throw error;
      }
    }
  }

  return {
    createCollection: async (request: CreateCollectionRequest) => {
      try {
        // sanitize request
        if (!request.name) {
          throw new Error("Did not specify name of collection in request");
        }
        if (!request.dimensionality) {
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
        const result: APIResult<CreateCollectionResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<UpdateResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    deleteCollection: async (request: DeleteCollectionRequest) => {
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
        const result: APIResult<DeleteCollectionResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<UpdateResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    insert: _insertDocument,
    update: async (request: UpdateRequest) => {
      try {
        // sanitize request
        _sanitizeCollectionIdentifiersInRequest(request);
        if (!request.documents) {
          throw new Error("Did not specify documents to update in request");
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
        const result: APIResult<UpdateResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<UpdateResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    delete: async (request: DeleteRequest) => {
      try {
        // sanitize request
        _sanitizeCollectionIdentifiersInRequest(request);
        if (!request.ids) {
          throw new Error("Did not specify documents to delete in request");
        }
        // make api call
        const response = await writerClient.delete<DeleteResponse>(
          DOCUMENTS_PATH,
          {
            data: request,
          }
        );
        const result: APIResult<DeleteResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<DeleteResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    query: async (request: QueryRequest) => {
      try {
        // sanitize request
        _sanitizeCollectionIdentifiersInRequest(request);
        if (
          request.query_embedding &&
          request.query_embedding.some(
            (embedding) => typeof embedding !== "number"
          )
        ) {
          throw new Error(
            "One of the embeddings in the request is not a valid number"
          );
        }
        // make api call
        const response = await readerClient.post<QueryResponse>(
          QUERY_PATH,
          request
        );
        const result: APIResult<QueryResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<QueryResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    inferSchema: async (request: InferSchemaRequest) => {
      try {
        // sanitize request
        _sanitizeCollectionIdentifiersInRequest(request);
        // make api call
        const response = await readerClient.post<InferSchemaResponse>(
          INFER_SCHEMA_PATH,
          request
        );
        const result: APIResult<InferSchemaResponse, ErrorResponse> = {
          data: response.data,
          error: null,
        };
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const result: APIResult<InferSchemaResponse, ErrorResponse> = {
            data: null,
            error: error?.response?.data,
          };
          return result;
        } else {
          throw error;
        }
      }
    },
    columnInsert: _columnInsert,
    initOpenAI: async (request: InitOpenAIRequest) => {
      try {
        _sanitizeInitOpenAIRequest(request);
        const configuration = new Configuration({
          apiKey: request.openaiKey,
        });
        openAIApiClient = new OpenAIApi(configuration);
      }
      catch (error) {
        throw error
      }
    },
    buildAndInsertEmbeddingsFromOpenAI: async (request: BuildAndInsertEmbeddingsFromOpenAIRequest) => {
      try {
        if (openAIApiClient === null) {
          throw new Error("OpenAI instance has not been initialized. Please initialize it using \"Client.init_openai()\"")
        }
        _sanitizeCollectionIdentifiersInRequest(request);

        const { model, inputData, documentMetadata, openaiUser, ...rest } = request;

        const embeddingResponse = await openAIApiClient.createEmbedding({
          model: model,
          input: inputData,
          user: openaiUser
        });

        const embeddingData = embeddingResponse.data.data;
        if (embeddingData === null) {
          return {
            openaiResponse: embeddingResponse,
            starpointResponse: null
          }
        }

        const sortedEmbeddingData = embeddingData.sort((a, b) => a.index - b.index);
        const embeddings = sortedEmbeddingData.map((embeddingData) => embeddingData.embedding)

        const starpointResponse = _columnInsert({ 
          embeddings,
          documentMetadata: (documentMetadata) !== null ? documentMetadata : _backfillDocumentMetadata(inputData),
          ...rest
        })

        return {
          openaiResponse: embeddingResponse,
          starpointResponse
        }

      }
      catch (error) {
        throw error
      }
    }
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
  collectionId: string;
}

export interface DeleteCollectionResponse {
  success: boolean;
}

// DOCUMENT TYPES
// INSERT
interface Document {
  embedding: number[];
  metadata: Option<Metadata>;
}

interface InsertDocuments {
  documents: Document[];
}

export type InsertRequest = ByWrapper<InsertDocuments>;

export interface InsertResponse {
  collectionId: string;
  documents: { id: string };
}

export type TransposeAndInsertRequest = ByWrapper<{
  embeddings: number[][];
  documentMetadata: Metadata[];
}>;

export interface TransposeAndInsertResponse {
  collectionId: string;
  documents: { id: string };
}

// UPDATE
interface UpdateDocument {
  id: string;
  metadata: Metadata;
}

export type UpdateRequest = ByWrapper<{ documents: UpdateDocument[] }>;

export interface UpdateResponse {
  collectionId: string;
  documents: { id: string }[];
}

// DELETE
export type DeleteRequest = ByWrapper<{ ids: string[] }>;

export interface DeleteResponse {
  collectionId: string;
  documentIds: string[];
}

// QUERY
interface QueryDocuments {
  queryEmbedding: Option<number[]>;
  sql: Option<string>;
  params: Option<Array<string | number>>;
}

export type QueryRequest = ByWrapper<QueryDocuments>;

export interface QueryResponse {
  collectionId: string;
  resultCount: number;
  sql: Option<string>;
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
  inferredSchema: InferredSchema;
}

// OPENAI
export interface InitOpenAIRequest {
  openaiKey: Option<string>;
  openaiKeyFilepath: Option<string>;
}

export type BuildAndInsertEmbeddingsFromOpenAIRequest = ByWrapper<{
  model: string;
  inputData: CreateEmbeddingRequestInput;
  documentMetadata: Option<Metadata[]>;
  openaiUser: Option<string>;
}>;

export interface BuildAndInsertEmbeddingsFromOpenAI {
  openaiResponse: CreateEmbeddingResponse;
  starpointResponse: any; // TODO:
}

interface ByCollectionName {
  collectionName: string;
}

type ByCollectionNameWrapper<T> = T & ByCollectionName;

interface ByCollectionId {
  collectionId: string;
}

type ByCollectionIdWrapper<T> = T & ByCollectionId;

type ByWrapper<T> = ByCollectionNameWrapper<T> | ByCollectionIdWrapper<T>;

type Metadata = Value | undefined | null;

interface Value {
  [key: string]: string | number;
}

export interface ErrorResponse {
  errorMessage: string;
}

export interface APIResult<T, ErrorResponse> {
  data: T | null;
  error: ErrorResponse | null;
}

export type Option<T> = T | null | undefined;