import axios from "axios";
import { API_KEY_HEADER_NAME } from "./constants";
import {
  columnInsertFactory,
  deleteDocumentsFactory,
  initWriter,
  insertDocumentsFactory,
  updateDocumentsFactory,
} from "./writer";
import {
  inferSchemaFactory,
  initReader,
  queryDocumentsFactory,
} from "./reader";
import {
  buildAndInsertEmbeddingsFromOpenAIFactory,
  initOpenAI,
} from "./open-ai";
import { createCollectionFactory, deleteCollectionFactory } from "./manager";
import { BuildAndInsertEmbeddingsFromOpenAIRequest } from "./open-ai/types";
import { embedFactory, initEmbedding } from "./embedding";

const initialize = (
  apiKey: string,
  options?: {
    writerHostURL?: string;
    readerHostURL?: string;
    embeddingHostURL?: string;
    openaiKey?: string;
  }
) => {
  axios.defaults.headers.common[API_KEY_HEADER_NAME] = apiKey;

  // writer
  const writerClient = initWriter(options?.writerHostURL);
  const insertDocuments = insertDocumentsFactory(writerClient);
  const columnInsert = columnInsertFactory(insertDocuments);
  const updateDocuments = updateDocumentsFactory(writerClient);
  const deleteDocuments = deleteDocumentsFactory(writerClient);

  // reader
  const readerClient = initReader(options?.readerHostURL);
  const queryDocuments = queryDocumentsFactory(readerClient);
  const inferSchema = inferSchemaFactory(readerClient);

  // management
  const createCollection = createCollectionFactory(writerClient);
  const deleteCollection = deleteCollectionFactory(writerClient);

  // embed
  const embeddingClient = initEmbedding(options?.embeddingHostURL);
  const embed = embedFactory(embeddingClient);

  // openai
  const openAIClient = initOpenAI(options?.openaiKey);
  const buildAndInsertEmbeddingsFromOpenAI =
    buildAndInsertEmbeddingsFromOpenAIFactory(openAIClient, columnInsert);
  const buildAndInsertEmbeddings = async (
    req: BuildAndInsertEmbeddingsFromOpenAIRequest
  ) =>
    buildAndInsertEmbeddingsFromOpenAI({
      model: "text-embedding-ada-002",
      ...req,
    });

  return {
    // writer
    insertDocuments,
    columnInsert,
    updateDocuments,
    deleteDocuments,
    // reader
    queryDocuments,
    inferSchema,
    // management
    createCollection,
    deleteCollection,
    // embed
    embed,
    // openai
    openai: {
      buildAndInsertEmbeddingsNoDefault: buildAndInsertEmbeddingsFromOpenAI,
      buildAndInsertEmbeddings,
    },
  };
};

export const db = { initialize };
