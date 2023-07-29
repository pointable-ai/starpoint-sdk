import { Configuration, OpenAIApi } from "openai";
import { db } from "starpoint";
import {
  APIResult,
  ErrorResponse,
  Option,
} from "starpoint/src/common-types";
import { backfillDocumentMetadata } from "./utility";
import {
  BuildAndInsertEmbeddingsFromOpenAIRequest,
  BuildAndInsertEmbeddingsRequest,
  BuildAndInsertEmbeddingsFromOpenAIResponse,
} from "./types";
import { OPENAI_INSTANCE_INIT_ERROR } from "./constants";
import { sanitizeCollectionIdentifiersInRequest } from "starpoint/src/validators";
import {
  InsertResponse,
  TransposeAndInsertRequest,
} from "../../typescript/src/writer/types";
import { handleError } from "starpoint/src/utility";

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
    ) => Promise<APIResult<InsertResponse>>
  ) =>
  async (
    request: BuildAndInsertEmbeddingsFromOpenAIRequest
  ): Promise<APIResult<BuildAndInsertEmbeddingsFromOpenAIResponse | null>> => {
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
        document_metadata !== null && document_metadata !== undefined
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

const initialize = (
  openaiKey: string,
  starpointAPI: ReturnType<typeof db.initialize>
) => {
  const { columnInsert } = starpointAPI;

  // openai
  const openAIClient = initOpenAI(openaiKey);
  const buildAndInsertEmbeddingsFromOpenAI =
    buildAndInsertEmbeddingsFromOpenAIFactory(openAIClient, columnInsert);
  const buildAndInsertEmbeddings = async (
    req: BuildAndInsertEmbeddingsRequest
  ) => {
    const { ...rest } = req;
    buildAndInsertEmbeddingsFromOpenAI({
      model: "text-embedding-ada-002",
      ...rest,
    });
  };
  return {
    // openai
    buildAndInsertEmbeddingsNoDefault: buildAndInsertEmbeddingsFromOpenAI,
    buildAndInsertEmbeddings,
  };
};

export const starpointOpenai = { initialize };
