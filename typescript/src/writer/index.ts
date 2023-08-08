import axios, { AxiosInstance } from "axios";
import ky from "ky-universal";
import {
  sanitizeCollectionIdentifiersInRequest,
  setAndValidateHost,
} from "../validators";
import {
  DOCUMENTS_PATH,
  MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR,
  MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
  MISSING_EMBEDDING_IN_DOCUMENT_ERROR,
  WRITER_URL,
} from "../constants";
import { APIResult, Document } from "../common-types";
import {
  DeleteRequest,
  DeleteResponse,
  InsertRequest,
  InsertResponse,
  TransposeAndInsertRequest,
  TransposeAndInsertResponse,
  UpdateRequest,
  UpdateResponse,
} from "./types";
import { handleError, zip } from "../utility";

export const initWriter = (client: typeof ky, writerHostURL?: string) => {
  return client.extend({
    prefixUrl: writerHostURL ? setAndValidateHost(writerHostURL) : WRITER_URL,
  });
};

export const insertDocumentsFactory =
  (writerClient: typeof ky) =>
  async (request: InsertRequest): Promise<APIResult<InsertResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      if (!request.documents || request.documents.length === 0) {
        throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
      }

      // make api call
      const response = await writerClient
        .post(DOCUMENTS_PATH, { json: request })
        .json<InsertResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return await handleError(err);
    }
  };

export const columnInsertFactory =
  (
    insertDocuments: (req: InsertRequest) => Promise<APIResult<InsertResponse>>
  ) =>
  async (
    request: TransposeAndInsertRequest
  ): Promise<APIResult<TransposeAndInsertResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);

      // transpose metadata and embeddings
      const { embeddings, document_metadata, ...rest } = request;
      const columns = zip(embeddings, document_metadata);
      const documents: Document[] = columns.map((column) => {
        const [embedding, metadata] = column;

        return {
          embedding,
          metadata,
        };
      });

      const insertRequest: InsertRequest = {
        ...rest,
        documents,
      };

      return insertDocuments(insertRequest);
    } catch (err) {
      return handleError(err);
    }
  };

export const updateDocumentsFactory =
  (writerClient: typeof ky) =>
  async (request: UpdateRequest): Promise<APIResult<UpdateResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      if (!request.documents || request.documents.length === 0) {
        throw new Error(MISSING_DOCUMENT_IN_REQUEST_ERROR);
      }
      // make api call
      const response = await writerClient
        .patch(DOCUMENTS_PATH, { json: request })
        .json<UpdateResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };

export const deleteDocumentsFactory =
  (writerClient: typeof ky) =>
  async (request: DeleteRequest): Promise<APIResult<DeleteResponse>> => {
    try {
      // sanitize request
      sanitizeCollectionIdentifiersInRequest(request);
      if (!request.ids || (request.ids && request.ids.length === 0)) {
        throw new Error(MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR);
      }
      // make api call
      const response = await writerClient
        .delete(DOCUMENTS_PATH, {
          json: request,
        })
        .json<DeleteResponse>();
      return {
        data: response,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };
