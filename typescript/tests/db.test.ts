import {
  db,
  InsertRequest,
  TransposeAndInsertRequest,
  APIResult,
  InsertResponse,
  UpdateResponse,
  UpdateRequest,
  ErrorResponse,
} from "../src/index";
import axios from "axios";
import { v4 as uuid4 } from "uuid";

const COLLECTIONS_PATH = "/api/v1/collections";
const DOCUMENTS_PATH = "/api/v1/documents";
const QUERY_PATH = "/api/v1/query";
const INFER_SCHEMA_PATH = "/api/v1/infer_schema";

const WRITER_URL = "https://writer.starpoint.ai";
const READER_URL = "https://reader.starpoint.ai";
const API_KEY_HEADER_NAME = "x-starpoint-key";

const MISSING_EMBEDDING_IN_DOCUMENT_ERROR =
  "Did not specify an embedding for a document in the request";
const MISSING_DOCUMENT_IN_REQUEST_ERROR =
  "Did not specify documents in request";
const EMBEDDING_NOT_NUMBER_ERROR =
  "One of the embeddings for a document contains an invalid number";
const MISSING_DOCUMENT_ID_IN_REQUEST_ERROR =
  "Did not specify an id for a document in the request";
const MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR =
  "Did not specify metadata for a document in the request";

// Mock Axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  mockedAxios.create.mockReturnThis();
});

afterEach(() => {
  mockedAxios.put.mockClear();
  mockedAxios.patch.mockClear();
  mockedAxios.get.mockClear();
  mockedAxios.post.mockClear();
});

describe("db.initialize", () => {
  it("should correctly set apiKey and default urls", () => {
    const MOCK_API_KEY = uuid4();
    const spy = jest.spyOn(db, "initialize");
    const client = db.initialize(MOCK_API_KEY);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY);
    expect(mockedAxios.defaults.headers.common[API_KEY_HEADER_NAME]).toBe(
      MOCK_API_KEY
    );
  });
  it("should correctly set writerURLHost if given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_WRITER_URL_HOST = "https://validtesthost.com";
    const spy = jest.spyOn(db, "initialize");
    db.initialize(MOCK_API_KEY, { writerHostURL: MOCK_WRITER_URL_HOST });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY, {
      writerHostURL: MOCK_WRITER_URL_HOST,
    });
    expect(mockedAxios.defaults.headers.common[API_KEY_HEADER_NAME]).toBe(
      MOCK_API_KEY
    );
  });
  it("should correctly set readerURLHost if given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_READER_URL_HOST = "https://validtesthost.com";
    const spy = jest.spyOn(db, "initialize");
    db.initialize(MOCK_API_KEY, { readerHostURL: MOCK_READER_URL_HOST });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(MOCK_API_KEY, {
      readerHostURL: MOCK_READER_URL_HOST,
    });
    expect(mockedAxios.defaults.headers.common[API_KEY_HEADER_NAME]).toBe(
      MOCK_API_KEY
    );
  });
});

describe("insertDocuments", () => {
  it("returns a valid response", async () => {
    const COLLECTION_ID = uuid4();
    const DOCUMENT_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          embedding: [0.1, 0.2, 0.3],
          metadata: { car: "abe", apple: "john", inventory_count: 12 },
        },
      ],
    };
    const mockResponse: APIResult<InsertResponse, ErrorResponse> = {
      data: {
        collection_id: COLLECTION_ID,
        documents: [{ id: DOCUMENT_ID }],
      },
      error: null,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(DOCUMENTS_PATH, mockRequest);
  });
  it("returns an error if embedding given contains a non-number", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          embedding: [0.1, 0.2, "abc"],
          metadata: { car: "abe", apple: "john", inventory_count: 12 },
        },
      ],
    };
    const mockResponse = {
      data: null,
      error: EMBEDDING_NOT_NUMBER_ERROR,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
  it("returns an error if embedding for a document is not provided", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          embedding: null,
          metadata: { car: "abe", apple: "john", inventory_count: 12 },
        },
      ],
    };
    const mockResponse = {
      data: null,
      error: MISSING_EMBEDDING_IN_DOCUMENT_ERROR,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
  it("returns an error if document is not provided", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };
    const mockResponse = {
      data: null,
      error: MISSING_DOCUMENT_IN_REQUEST_ERROR,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
});

describe("updateDocuments", () => {
  it("returns a valid response", async () => {
    const COLLECTION_ID = uuid4();
    const DOCUMENT_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: UpdateRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          id: DOCUMENT_ID,
          metadata: { car: "updated_value" },
        },
      ],
    };
    const mockResponse: APIResult<UpdateResponse, ErrorResponse> = {
      data: {
        collection_id: COLLECTION_ID,
        documents: [{ id: DOCUMENT_ID }],
      },
      error: null,
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.patch).toHaveBeenCalledWith(DOCUMENTS_PATH, mockRequest);
  });
  it("returns an error if documents is not provided", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [],
    };
    const mockResponse = {
      data: null,
      error: MISSING_DOCUMENT_IN_REQUEST_ERROR,
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
  it("returns an error if documents in request do not have an id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          metadata: { car: "apple" },
        },
      ],
    };
    const mockResponse = {
      data: null,
      error: MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
  it("returns an error if documents in request do not have metadata", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      documents: [
        {
          id: DOCUMENT_ID,
          metadata: null,
        },
      ],
    };
    const mockResponse = {
      data: null,
      error: MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
});

describe("columnInsert", () => {
  it("should return a valid response for same length embedding list and metadata list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: TransposeAndInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [
        [0.1, 0.2],
        [0.1, 0.4],
      ],
      documentMetadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockResponse = {
      data: {
        collection_id: MOCK_COLLECTION_ID,
        documents: [
          {
            id: uuid4(),
          },
          {
            id: uuid4(),
          },
        ],
      },
      error: null,
    };
    const mockInsertRequest: InsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embedding: [0.1, 0.2],
          metadata: { car: 1, horse: "neigh" },
        },
        {
          embedding: [0.1, 0.4],
          metadata: { car: 2, horse: "bleh" },
        },
      ],
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      DOCUMENTS_PATH,
      mockInsertRequest
    );
  });
  it("should return an error if embedding contains non-number value", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [
        [0.1, "apple"],
        [0.1, 0.4],
      ],
      documentMetadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockResponse = {
      data: null,
      error: EMBEDDING_NOT_NUMBER_ERROR,
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
  it("should return a valid response if embeddings list is shorter than document metadata list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [[0.1, 0.2]],
      documentMetadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockResponse = {
      data: {
        collection_id: MOCK_COLLECTION_ID,
        documents: [
          {
            id: uuid4(),
          },
          {
            id: uuid4(),
          },
        ],
      },
      error: null,
    };
    const mockInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embedding: [0.1, 0.2],
          metadata: { car: 1, horse: "neigh" },
        },
      ],
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      DOCUMENTS_PATH,
      mockInsertRequest
    );
  });
  it("should return a valid response if metadata list is shorter than embedding list", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [
        [0.1, 0.2],
        [0.4, 0.3],
      ],
      documentMetadata: [{ car: 1, horse: "neigh" }, ,],
    };
    const mockResponse = {
      data: {
        collection_id: MOCK_COLLECTION_ID,
        documents: [
          {
            id: uuid4(),
          },
          {
            id: uuid4(),
          },
        ],
      },
      error: null,
    };
    const mockInsertRequest = {
      collection_id: MOCK_COLLECTION_ID,
      documents: [
        {
          embedding: [0.1, 0.2],
          metadata: { car: 1, horse: "neigh" },
        },
        {
          embedding: [0.4, 0.3],
        },
      ],
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      DOCUMENTS_PATH,
      mockInsertRequest
    );
  });
  it("should return an error if embedding list is empty", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
      embeddings: [],
      documentMetadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockResponse = {
      data: null,
      error: MISSING_DOCUMENT_IN_REQUEST_ERROR,
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toBeCalled();
  });
});
