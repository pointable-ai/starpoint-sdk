import axios, { AxiosInstance } from "axios";
import {
  CreateCollectionRequest,
  CreateCollectionResponse,
  DeleteCollectionRequest,
  DeleteCollectionResponse,
} from "./types";
import { APIResult, ErrorResponse } from "../common-types";
import {
  COLLECTIONS_PATH,
  CREATE_COLLECTION_MISSING_NAME_ERROR,
  CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR,
  CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR,
  MISSING_COLLECTION_ID_ERROR,
} from "../constants";
import { handleError } from "../utility";

export const createCollectionFactory =
  (managerClient: AxiosInstance) =>
  async (
    request: CreateCollectionRequest
  ): Promise<APIResult<CreateCollectionResponse>> => {
    try {
      // sanitize request
      if (!request.name) {
        throw new Error(CREATE_COLLECTION_MISSING_NAME_ERROR);
      }
      if (
        request.dimensionality === undefined ||
        request.dimensionality === null
      ) {
        throw new Error(CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR);
      }
      if (request.dimensionality <= 0) {
        throw new Error(CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR);
      }

      // make api call
      const response = await managerClient.post<CreateCollectionResponse>(
        COLLECTIONS_PATH,
        request
      );
      return {
        data: response.data,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };

export const deleteCollectionFactory =
  (managerClient: AxiosInstance) =>
  async (
    request: DeleteCollectionRequest
  ): Promise<APIResult<DeleteCollectionResponse>> => {
    try {
      if (!request.collection_id) {
        throw new Error(MISSING_COLLECTION_ID_ERROR);
      }
      // make api call
      const response = await managerClient.delete<DeleteCollectionResponse>(
        COLLECTIONS_PATH,
        {
          data: request,
        }
      );
      return {
        data: response.data,
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };
