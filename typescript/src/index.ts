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
    insert: async (request: InsertDocumentsRequest) => {
      return await composerClient.post<InsertDocumentsResponse>(
        "/documents",
        request
      );
    },
    query: async (request: QueryDocumentsRequest) => {
      return await readerClient.post<QueryDocumentsResponse>("/query", request);
    },
  };
};

// INSERT TYPES
interface InsertDocumentsDocument {
  embedding: number[];
  metadata:
    | {
        [key: string]: string | number;
      }
    | undefined
    | null;
}

interface InsertDocuments {
  documents: InsertDocumentsDocument[];
}

type InsertDocumentsRequest = ByWrapper<InsertDocuments>;

interface InsertDocumentsResponse {
  collection_id: string;
  documents: { id: string } & InsertDocumentsDocument;
}

// QUERY TYPES
interface QueryDocuments {
  query_embedding?: number[] | undefined | null;
  sql?: string | undefined | null;
}

type QueryDocumentsRequest = ByWrapper<QueryDocuments>;

interface QueryDocumentsResponse {
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
