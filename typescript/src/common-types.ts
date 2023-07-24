export interface ByCollectionName {
  collection_name: string;
}

export type ByCollectionNameWrapper<T> = T & ByCollectionName;

export interface ByCollectionId {
  collection_id: string;
}

export type ByCollectionIdWrapper<T> = T & ByCollectionId;

export type ByWrapper<T> =
  | ByCollectionNameWrapper<T>
  | ByCollectionIdWrapper<T>;

export type Metadata = Value | undefined | null;

export interface Value {
  [key: string]: string | number;
}

export interface ErrorResponse {
  error_message: string;
}

export interface APIResult<T, U = ErrorResponse> {
  data: T | null;
  error: U | null;
}

export type Option<T> = T | null | undefined;

export interface Document {
  embedding: number[];
  metadata?: Option<Metadata>;
}

export const EMBEDDING_MODELS = ["MINI6", "MINI12"] as const;
