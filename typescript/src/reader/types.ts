import { ByWrapper, Option } from "../common-types";

// QUERY
export interface QueryDocuments {
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
    __distance: Option<number>;
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

export interface InferredSchema {
  types: Record<string, InferredType[]>;
  nullability: Record<string, boolean>;
}

export type InferSchemaRequest = ByWrapper<{}>;

export interface InferSchemaResponse {
  inferred_schema: InferredSchema;
}
