export const COLLECTIONS_PATH = "api/v1/collections";
export const DOCUMENTS_PATH = "api/v1/documents";
export const QUERY_PATH = "api/v1/query";
export const INFER_SCHEMA_PATH = "api/v1/infer_schema";
export const EMBED_PATH = "api/v1/embed";

export const WRITER_URL = "https://writer.starpoint.ai";
export const READER_URL = "https://reader.starpoint.ai";
export const EMBEDDING_URL = "https://embedding.starpoint.ai";

export const API_KEY_HEADER_NAME = "x-starpoint-key";

export const MISSING_EMBEDDING_IN_DOCUMENT_ERROR =
  "Did not specify an embedding for a document in the request";
export const MISSING_COLLECTION_IDENTIFIER_ERROR =
  "Did not specify id or name identifier for collection in request";
export const NULL_COLLECTION_ID_ERROR =
  "Id cannot be null for collection in request";
export const NULL_COLLECTION_NAME_ERROR =
  "Name identifier cannot be null for collection in request";
export const MULTIPLE_COLLECTION_IDENTIFIER_ERROR =
  "Request has too many identifiers. Either pass in collection_id or collection_name, not both";
export const DEFAULT_TEXT_EMBEDDING_OPENAI_MODEL = "text-embedding-ada-002";
export const MISSING_COLLECTION_ID_ERROR =
  "Did not specify collection_id in request";
export const MISSING_COLLECTION_NAME_ERROR =
  "Did not specify name of collection in request";
export const MISSING_DOCUMENT_IN_REQUEST_ERROR =
  "Did not specify documents in request";
export const MISSING_DOCUMENT_ID_IN_REQUEST_ERROR =
  "Did not specify an id for a document in the request";
export const MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR =
  "Did not specify metadata for a document in the request";
export const MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR =
  "Did not specify document id(s) to delete in request";
export const INTERNAL_SERVER_ERROR = "Internal server error";
export const CREATE_COLLECTION_MISSING_NAME_ERROR =
  "Did not specify name of collection in request";
export const CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR =
  "Did not specify dimensionality of collection in request";
export const CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR =
  "Dimensionality cannot be less than or equal to 0";
export const MISSING_HOST_ERROR =
  "No host value provided. A host must be provided.";
