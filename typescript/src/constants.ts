const COLLECTIONS_PATH = "/api/v1/collections";
const DOCUMENTS_PATH = "/api/v1/documents";
const QUERY_PATH = "/api/v1/query";
const INFER_SCHEMA_PATH = "/api/v1/infer_schema";

const WRITER_URL = "https://writer.starpoint.ai";
const READER_URL = "https://reader.starpoint.ai";
const API_KEY_HEADER_NAME = "x-starpoint-key";


const MISSING_EMBEDDING_IN_DOCUMENT_ERROR = "Did not specify an embedding for a document in the request";
const MISSING_COLLECTION_IDENTIFIER_ERROR =
  "Did not specify id or name identifier for collection in request";
const NULL_COLLECTION_ID_ERROR = "Id cannot be null for collection in request";
const NULL_COLLECTION_NAME_ERROR =
  "Name identifier cannot be null for collection in request";
const NULL_OPENAI_KEY_IDENTIFIER_ERROR = "OpenAI key cannot be null in request";
const NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR =
  "OpenAI key filepath cannot be null in request";
const OPENAI_KEY_FILEPATH_INVALID_ERROR =
  "OpenAI key filepath must be a file in request";
const MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR =
  "Request has too many identifiers. Either pass in openai_key or openai_key_filepath, not both";
const MULTIPLE_COLLECTION_IDENTIFIER_ERROR =
  "Request has too many identifiers. Either pass in openai_key or openai_key_filepath, not both";
const MISSING_OPENAI_KEY_IDENTIFIER_ERROR =
  "Did not specify openai_key or openai_key_filepath in request";
const OPEN_AI_INSTANCE_INIT_ERROR =
  'OpenAI instance has not been initialized. Please initialize it using "client.initOpenai()"';
const DEFAULT_TEXT_EMBEDDING_OPENAI_MODEL = "text-embedding-ada-002";
const MISSING_COLLECTION_ID_ERROR = "Did not specify collection_id in request";
const MISSING_COLLECTION_NAME_ERROR =
  "Did not specify name of collection in request";
const MISSING_DOCUMENT_IN_REQUEST_ERROR =
  "Did not specify documents in request";
const MISSING_DOCUMENT_ID_IN_REQUEST_ERROR =
  "Did not specify an id for a document in the request";
const MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR =
  "Did not specify metadata for a document in the request";
const MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR =
  "Did not specify document id(s) to delete in request";
const INTERNAL_SERVER_ERROR = "Internal server error";
const CREATE_COLLECTION_MISSING_NAME_ERROR =
  "Did not specify name of collection in request";
const CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR =
  "Did not specify dimensionality of collection in request";
const CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR =
  "Dimensionality cannot be less than or equal to 0";

export {
  COLLECTIONS_PATH,
  DOCUMENTS_PATH,
  QUERY_PATH,
  INFER_SCHEMA_PATH,
  WRITER_URL,
  READER_URL,
  API_KEY_HEADER_NAME,
  MISSING_EMBEDDING_IN_DOCUMENT_ERROR,
  MISSING_COLLECTION_IDENTIFIER_ERROR,
  MISSING_COLLECTION_ID_ERROR,
  MISSING_COLLECTION_NAME_ERROR,
  MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR,
  MISSING_DOCUMENT_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
  INTERNAL_SERVER_ERROR,
  CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR,
  CREATE_COLLECTION_MISSING_NAME_ERROR,
  CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR,
  DEFAULT_TEXT_EMBEDDING_OPENAI_MODEL,
  OPEN_AI_INSTANCE_INIT_ERROR,
  MULTIPLE_COLLECTION_IDENTIFIER_ERROR,
  MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR,
  MISSING_OPENAI_KEY_IDENTIFIER_ERROR,
  NULL_OPENAI_KEY_IDENTIFIER_ERROR,
  NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR,
  OPENAI_KEY_FILEPATH_INVALID_ERROR,
  NULL_COLLECTION_NAME_ERROR,
  NULL_COLLECTION_ID_ERROR,
};
