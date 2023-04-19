import axios from "axios";

const COMPOSER_URL = "https://composer.envelope.ai/api/v1";
const READER_URL = "https://reader.envelope.ai/api/v1";
const API_KEY_HEADER_NAME = "x-envelope-key";

export const initialize = (apiKey: string) => {
  const composerClient = axios.create({
    baseURL: COMPOSER_URL,
    headers: {
      common: {
        [API_KEY_HEADER_NAME]: apiKey,
      },
    },
  });

  const readerClient = axios.create({
    baseURL: READER_URL,
    headers: {
      common: {
        [API_KEY_HEADER_NAME]: apiKey,
      },
    },
  });

  return {
    insert: async (request: InsertRequest) => {
      return await composerClient.post<InsertResponse>("/documents", request);
    },
    update: async (request: UpdateRequest) => {
      return await composerClient.patch<UpdateResponse>("/documents", request);
    },
    delete: async (request: DeleteRequest) => {
      return await composerClient.delete<DeleteResponse>("/documents", {
        data: request,
      });
    },
    query: async (request: QueryRequest) => {
      return await readerClient.post<QueryResponse>("/query", request);
    },
  };
};

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
  documents: { id: string } & InsertDocumentsDocument;
}

// UPDATE TYPES
interface UpdateDocument {
  id: string;
  metadata: Metadata;
}

export type UpdateRequest = ByWrapper<UpdateDocument>;

export interface UpdateResponse {
  collection_id: string;
  documents: UpdateDocument[];
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
    [key: string]: string | number | undefined | null;
    distance?: number | undefined | null;
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
