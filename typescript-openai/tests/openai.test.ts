import axios from "axios";
import { v4 as uuid4 } from "uuid";
import { db } from "starpoint";
import { starpointOpenai } from "../src";
import { OpenAIApi } from "openai";
import { BuildAndInsertEmbeddingsFromOpenAIRequest } from "../src/types";

// Mock Axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock OpenAI
jest.mock("openai");
const createEmbeddingSpy = jest.spyOn(OpenAIApi.prototype, "createEmbedding");

// Mock starpoint initialized objects
const starpointDbSpy = jest.spyOn(db, "initialize");
starpointDbSpy.mockReturnValue({
  inferSchema: jest.fn(),
  columnInsert: jest.fn(),
  insertDocuments: jest.fn(),
  deleteDocuments: jest.fn(),
  updateDocuments: jest.fn(),
  createCollection: jest.fn(),
  deleteCollection: jest.fn(),
  embed: jest.fn(),
  queryDocuments: jest.fn(),
});
const starpointOpenAiClientSpy = jest.spyOn(starpointOpenai, "initialize");

beforeAll(() => {
  mockedAxios.create.mockReturnThis();
});

afterEach(() => {
  mockedAxios.delete.mockClear();
  mockedAxios.put.mockClear();
  mockedAxios.patch.mockClear();
  mockedAxios.get.mockClear();
  mockedAxios.post.mockClear();
  starpointDbSpy.mockClear();
  starpointOpenAiClientSpy.mockClear();
  createEmbeddingSpy.mockReset();
});

describe("starpointOpenAi.initialize", () => {
  it("should correctly set openAIKey and starpointAi and default urls", () => {
    const MOCK_OPENAI_KEY = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    expect(starpointDbSpy).toHaveBeenCalled();
    expect(starpointDbSpy).toHaveBeenCalledWith(MOCK_API_KEY);
    starpointOpenai.initialize(MOCK_OPENAI_KEY, dbClient);
    expect(starpointOpenAiClientSpy).toHaveBeenCalled();
    expect(starpointOpenAiClientSpy).toHaveBeenCalledWith(
      MOCK_OPENAI_KEY,
      dbClient
    );
  });
});

describe("buildAndInsertEmbeddings", () => {
  it("should return an openai response, but not a starpoint response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const mockInitializeClient = starpointDbSpy.getMockImplementation();
    const dbClient = mockInitializeClient(MOCK_API_KEY);
    const MOCK_OPENAI_KEY = uuid4();
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      input_data: "this is test input",
    };
    const starpointOpenAiClient = starpointOpenai.initialize(
      MOCK_OPENAI_KEY,
      dbClient
    );
    const columnInsertSpy = jest.spyOn(dbClient, "columnInsert");

    await starpointOpenAiClient.buildAndInsertEmbeddings(mockRequest);
    // check that mock returned an openai response
    expect(createEmbeddingSpy).toHaveBeenCalled();

    // check that starpoint column insert is not called;
    expect(columnInsertSpy).not.toHaveBeenCalled();
  });
  it("should return both an openai response and a starpoint response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const mockInitializeClient = starpointDbSpy.getMockImplementation();
    const dbClient = mockInitializeClient(MOCK_API_KEY);
    const MOCK_OPENAI_KEY = uuid4();
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      input_data: "this is test input",
    };
    const starpointOpenAiClient = starpointOpenai.initialize(
      MOCK_OPENAI_KEY,
      dbClient
    );

    const mockCreateEmbeddingResponse = {
      data: {
        object: "mock",
        model: "text-embedding-ada-002",
        usage: { prompt_tokens: 0, total_tokens: 0 },
        data: [
          { index: 1, embedding: [0.1, 0.2, 0.3], object: "mock" },
          { index: 2, embedding: [0.4, 0.5, 0.6], object: "mock" },
        ],
      },
      status: 200,
      statusText: "ok",
      headers: null,
      config: null,
    };
    const mockColumnInsertResponse = {
      data: {
        collection_id: MOCK_COLLECTION_ID,
        documents: [],
      },
      error: null,
    };
    const columnInsertSpy = jest.spyOn(dbClient, "columnInsert");

    createEmbeddingSpy.mockResolvedValue(mockCreateEmbeddingResponse);
    columnInsertSpy.mockResolvedValue(mockColumnInsertResponse);
    await starpointOpenAiClient.buildAndInsertEmbeddings(mockRequest);
    // check that mock returned an openai response
    expect(createEmbeddingSpy).toHaveBeenCalled();

    // check that starpoint column insert is called;
    expect(columnInsertSpy).toHaveBeenCalled();

    columnInsertSpy.mockReset();
  });
});

describe("buildAndInsertEmbeddingsNoDefault", () => {
  it("should return only an openai response and not a starpoint response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const mockInitializeClient = starpointDbSpy.getMockImplementation();
    const dbClient = mockInitializeClient(MOCK_API_KEY);
    const MOCK_OPENAI_KEY = uuid4();
    const mockRequest: BuildAndInsertEmbeddingsFromOpenAIRequest = {
      collection_id: MOCK_COLLECTION_ID,
      model: "text-image-ada-002",
      input_data: "this is test input",
      document_metadata: [{ car: 2 }, { car: 1 }],
    };
    const starpointOpenAiClient = starpointOpenai.initialize(
      MOCK_OPENAI_KEY,
      dbClient
    );
    const columnInsertSpy = jest.spyOn(dbClient, "columnInsert");

    await starpointOpenAiClient.buildAndInsertEmbeddingsNoDefault(mockRequest);
    // check that mock returned an openai response
    expect(createEmbeddingSpy).toHaveBeenCalled();

    // check that starpoint column insert is not called;
    expect(columnInsertSpy).not.toHaveBeenCalled();

    columnInsertSpy.mockReset();
    createEmbeddingSpy.mockReset();
  });
});
