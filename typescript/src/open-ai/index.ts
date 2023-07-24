import { Configuration, OpenAIApi } from "openai";
import { APIResult, ErrorResponse, Option } from "../common-types";
import { backfillDocumentMetadata } from "./utility";
import {
  BuildAndInsertEmbeddingsFromOpenAIRequest,
  BuildAndInsertEmbeddingsFromOpenAIResponse,
} from "./types";
import { OPENAI_INSTANCE_INIT_ERROR } from "./constants";
import { sanitizeCollectionIdentifiersInRequest } from "../validators";
import { InsertResponse, TransposeAndInsertRequest } from "../writer/types";
import { handleError } from "../utility";

export interface InitOpenAIRequest {
  openai_key?: Option<string>;
  openai_key_filepath?: Option<string>;
}

export interface InitOpenAIResponse {
  success: boolean;
}

export const initOpenAI = (openaiKey: string) => {
  const configuration = new Configuration({
    apiKey: openaiKey,
  });

  return new OpenAIApi(configuration);
};

export const buildAndInsertEmbeddingsFromOpenAIFactory =
  (
    openAIApiClient: OpenAIApi | null,
    columnInsert: (
      req: TransposeAndInsertRequest
    ) => Promise<APIResult<InsertResponse, ErrorResponse>>
  ) =>
  async (
    request: BuildAndInsertEmbeddingsFromOpenAIRequest
  ): Promise<
    APIResult<BuildAndInsertEmbeddingsFromOpenAIResponse, ErrorResponse>
  > => {
    try {
      if (openAIApiClient === null) {
        throw new Error(OPENAI_INSTANCE_INIT_ERROR);
      }
      sanitizeCollectionIdentifiersInRequest(request);

      const { model, input_data, document_metadata, openai_user, ...rest } =
        request;

      const embeddingResponse = await openAIApiClient.createEmbedding({
        model: model,
        input: input_data,
        user: openai_user,
      });

      const embeddingData = embeddingResponse.data.data;
      if (embeddingData === null) {
        const response: APIResult<BuildAndInsertEmbeddingsFromOpenAIResponse> =
          {
            data: {
              openai_response: embeddingResponse.data,
              starpoint_response: null,
            },
            error: null,
          };
        return response;
      }

      const sortedEmbeddingData = embeddingData.sort(
        (a, b) => a.index - b.index
      );
      const embeddings = sortedEmbeddingData.map(
        (embeddingData) => embeddingData.embedding
      );

      const requestedDocumentMetadata =
        document_metadata !== null
          ? document_metadata
          : backfillDocumentMetadata(input_data);

      const starpointResponse = await columnInsert({
        embeddings,
        document_metadata: requestedDocumentMetadata,
        ...rest,
      });

      return {
        data: {
          openai_response: embeddingResponse.data,
          starpoint_response: starpointResponse.data,
        },
        error: null,
      };
    } catch (err) {
      return handleError(err);
    }
  };
