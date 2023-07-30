import fs from "fs";
import { ByWrapper } from "starpoint";
import { InitOpenAIRequest } from "..";
import {
  MISSING_COLLECTION_IDENTIFIER_ERROR,
  MISSING_OPENAI_KEY_IDENTIFIER_ERROR,
  MULTIPLE_COLLECTION_IDENTIFIER_ERROR,
  MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR,
  NULL_COLLECTION_ID_ERROR,
  NULL_COLLECTION_NAME_ERROR,
  NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR,
  NULL_OPENAI_KEY_IDENTIFIER_ERROR,
  OPENAI_KEY_FILEPATH_INVALID_ERROR,
} from "./constants";

export const sanitizeInitOpenAIRequest = async (request: InitOpenAIRequest) => {
  const fileStats = request.openai_key_filepath
    ? await fs.promises.stat(request.openai_key_filepath)
    : null;

  if ("openai_key" in request && "openai_key_filepath" in request) {
    throw new Error(MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR);
  }
  if (!("openai_key" in request) && !("openai_key_filepath" in request)) {
    throw new Error(MISSING_OPENAI_KEY_IDENTIFIER_ERROR);
  }
  if (
    !("openai_key_filepath" in request) &&
    "openai_key" in request &&
    !request.openai_key
  ) {
    throw new Error(NULL_OPENAI_KEY_IDENTIFIER_ERROR);
  }
  if (
    !("openai_key" in request) &&
    "openai_key_filepath" in request &&
    !request.openai_key_filepath
  ) {
    throw new Error(NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR);
  }
  if (
    !("openai_key" in request) &&
    "openai_key_filepath" in request &&
    fileStats &&
    fileStats.isFile()
  ) {
    throw new Error(OPENAI_KEY_FILEPATH_INVALID_ERROR);
  }
};

export function sanitizeCollectionIdentifiersInRequest<T>(
  request: ByWrapper<T>
) {
  if ("collection_id" in request && "collection_name" in request) {
    throw new Error(MULTIPLE_COLLECTION_IDENTIFIER_ERROR);
  }
  if (!("collection_id" in request) && !("collection_name" in request)) {
    throw new Error(MISSING_COLLECTION_IDENTIFIER_ERROR);
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
