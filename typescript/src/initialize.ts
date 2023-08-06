import axios from "axios";
import ky from "ky-universal";
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
  const httpClient = ky.create({
    headers: {
      [API_KEY_HEADER_NAME]: apiKey,
    },
  });

  // writer
  const writerClient = initWriter(httpClient, options?.writerHostURL);
  const insertDocuments = insertDocumentsFactory(writerClient);
  const columnInsert = columnInsertFactory(insertDocuments);
  const updateDocuments = updateDocumentsFactory(writerClient);
  const deleteDocuments = deleteDocumentsFactory(writerClient);

  // reader
  const readerClient = initReader(httpClient, options?.readerHostURL);
  const queryDocuments = queryDocumentsFactory(readerClient);
  const inferSchema = inferSchemaFactory(readerClient);

  // management
  const createCollection = createCollectionFactory(writerClient);
  const deleteCollection = deleteCollectionFactory(writerClient);

  // embed
  const embeddingClient = initEmbedding(httpClient, options?.embeddingHostURL);
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
