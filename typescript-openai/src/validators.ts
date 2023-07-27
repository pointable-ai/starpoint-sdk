import fs from "fs";
import { InitOpenAIRequest } from "..";
import {
  MISSING_OPENAI_KEY_IDENTIFIER_ERROR,
  MULTIPLE_OPENAI_KEY_IDENTIFIER_ERROR,
  NULL_OPENAI_KEY_FILEPATH_IDENTIFIER_ERROR,
  NULL_OPENAI_KEY_IDENTIFIER_ERROR,
  OPENAI_KEY_FILEPATH_INVALID_ERROR,
} from "./constants";

export const sanitizeInitOpenAIRequest = async (request: InitOpenAIRequest) => {
  const fileStats = await fs.promises.stat(request.openai_key_filepath);

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
    request.openai_key_filepath &&
    fileStats.isFile()
  ) {
    throw new Error(OPENAI_KEY_FILEPATH_INVALID_ERROR);
  }
};
