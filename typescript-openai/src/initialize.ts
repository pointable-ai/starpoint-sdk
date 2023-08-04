import { db } from "starpoint";
import { BuildAndInsertEmbeddingsRequest } from "./types";
import {
  initOpenAI,
  buildAndInsertEmbeddingsFromOpenAIFactory,
} from "./embeddings";


const initialize = (
    openaiKey: string,
    starpointAPI: ReturnType<typeof db.initialize>
  ) => {
    const { columnInsert } = starpointAPI;

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
      buildAndInsertEmbeddingsNoDefault: buildAndInsertEmbeddingsFromOpenAI,
      buildAndInsertEmbeddings,
    };
  };


export const starpointOpenai = { initialize };
