export const NULL_OPENAI_KEY_IDENTIFIER_ERROR =
  "OpenAI key cannot be null in request";
export const NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR =
  "OpenAI key filepath cannot be null in request";
export const OPENAI_KEY_FILEPATH_INVALID_ERROR =
  "OpenAI key filepath must be a file in request";
export const MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR =
  "Request has too many identifiers. Either pass in openai_key or openai_key_filepath, not both";
export const MISSING_OPENAI_KEY_IDENTIFIER_ERROR =
  "Did not specify openai_key or openai_key_filepath in request";
export const OPENAI_INSTANCE_INIT_ERROR =
  'OpenAI instance has not been initialized. Please initialize it using "client.initOpenai()"';
