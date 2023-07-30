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
import { createCollectionFactory, deleteCollectionFactory } from "./manager";
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
  };
};

export const db = { initialize };

export * from "./writer/types";
export * from "./embedding/types";
export * from "./reader/types";
export * from "./manager/types";
export * from "./common-types";
