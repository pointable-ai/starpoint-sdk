import {
  db,
  InsertRequest,
  DeleteRequest,
  TransposeAndInsertRequest,
  APIResult,
  InsertResponse,
  UpdateResponse,
  UpdateRequest,
  ErrorResponse,
  DeleteResponse,
  QueryResponse,
  InferSchemaResponse,
  InferredType,
  DeleteCollectionResponse,
  CreateCollectionResponse,
  TransposeAndInsertResponse,
} from "../src/index";
import axios from "axios";
import { v4 as uuid4 } from "uuid";

import {
  COLLECTIONS_PATH,
  DOCUMENTS_PATH, QUERY_PATH,
  INFER_SCHEMA_PATH,
  WRITER_URL,
  READER_URL,
  INTERNAL_SERVER_ERROR,
  API_KEY_HEADER_NAME,
  MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR,
  MISSING_DOCUMENT_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR,
  MISSING_DOCUMENT_ID_IN_REQUEST_ERROR,
  CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR,
  CREATE_COLLECTION_MISSING_NAME_ERROR,
  CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR,
} from "../src/constants";

// Mock Axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  mockedAxios.create.mockReturnThis();
});

afterEach(() => {
  mockedAxios.delete.mockClear();
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
  it("should correctly set writerURLHost if valid host given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_WRITER_URL_HOST = "https://200testhost.com";
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
  it("should correctly set readerURLHost if valid host given", () => {
    const MOCK_API_KEY = uuid4();
    const MOCK_READER_URL_HOST = "https://200testhost.com";
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
  it("returns a 200 response", async () => {
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
      error: { error_message: MISSING_EMBEDDING_IN_DOCUMENT_ERROR },
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
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
      error: { error_message: MISSING_DOCUMENT_IN_REQUEST_ERROR },
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.insertDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if axios post call fails", async () => {
    const COLLECTION_ID = uuid4();
    const DOCUMENT_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
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
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.post.mockRejectedValue(mockError);
    const actualResponse = await dbClient.insertDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      DOCUMENTS_PATH,
      mockRequest
    );
  });
});

describe("updateDocuments", () => {
  it("returns a 200 response", async () => {
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
      error: { error_message: MISSING_DOCUMENT_IN_REQUEST_ERROR },
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
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
      error: { error_message: MISSING_DOCUMENT_ID_IN_REQUEST_ERROR },
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
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
      error: { error_message: MISSING_DOCUMENT_METADATA_IN_REQUEST_ERROR },
    };
    mockedAxios.patch.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.updateDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if axios patch call fails", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
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
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.patch.mockRejectedValue(mockError);
    const actualResponse = await dbClient.updateDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.patch).toHaveBeenCalledWith(DOCUMENTS_PATH, mockRequest);
  });
});

describe("deleteDocuments", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: DeleteRequest = {
      collection_id: MOCK_COLLECTION_ID,
      ids: [DOCUMENT_ID],
    };
    const mockResponse: APIResult<DeleteResponse, ErrorResponse> = {
      data: {
        collection_id: MOCK_COLLECTION_ID,
        document_ids: [DOCUMENT_ID],
      },
      error: null,
    };
    mockedAxios.delete.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.deleteDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.delete).toHaveBeenCalledWith(DOCUMENTS_PATH, {
      data: mockRequest,
    });
  });
  it("should return an error if no document ids are provided", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest: DeleteRequest = {
      collection_id: MOCK_COLLECTION_ID,
      ids: [],
    };
    const mockResponse = {
      data: null,
      error: { error_message: MISSING_DOCUMENT_IDS_IN_DELETE_REQUEST_ERROR },
    };
    mockedAxios.delete.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.deleteDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });
  it("should return an error if axios delete call fails", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const DOCUMENT_ID = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      ids: [DOCUMENT_ID],
    };
    const mockResponse: APIResult<DeleteResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.delete.mockRejectedValue(mockError);
    const actualResponse = await dbClient.deleteDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.delete).toHaveBeenCalledWith(DOCUMENTS_PATH, {
      data: mockRequest,
    });
  });
});

describe("queryDocuments", () => {
  it("should return a 200 response given a collection id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };
    const mockResponse: APIResult<QueryResponse, ErrorResponse> = {
      data: {
        collection_id: COLLECTION_ID,
        result_count: 10,
        results: [],
      },
      error: null,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.queryDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(QUERY_PATH, mockRequest);
  });
  it("should return an 200 response if query embedding is given", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
      query_embedding: [0.1, 0.2, 0.3],
    };
    const mockResponse = {
      data: {
        collection_id: COLLECTION_ID,
        result_count: 10,
        results: [],
      },
      error: null,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.queryDocuments(mockRequest as any);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(QUERY_PATH, mockRequest);
  });
  it("should return an error if axios post call fails", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      collection_name: MOCK_COLLECTION_NAME,
    };
    const mockResponse: APIResult<QueryResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.post.mockRejectedValue(mockError);
    const actualResponse = await dbClient.queryDocuments(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(QUERY_PATH, mockRequest);
  });
});

describe("inferSchema", () => {
  it("should return a 200 response given a collection id", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };
    const mockResponse: APIResult<InferSchemaResponse, ErrorResponse> = {
      data: {
        inferred_schema: {
          types: {
            car: [InferredType.String],
            inventory_count: [InferredType.Number],
          },
          nullability: {
            car: false,
            inventory_count: false,
          },
        },
      },
      error: null,
    };
    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.inferSchema(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      INFER_SCHEMA_PATH,
      mockRequest
    );
  });
  it("should return an error if axios post call fails", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };
    const mockResponse: APIResult<InferSchemaResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.post.mockRejectedValue(mockError);
    const actualResponse = await dbClient.inferSchema(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      INFER_SCHEMA_PATH,
      mockRequest
    );
  });
});

describe("columnInsert", () => {
  it("should return a 200 response for same length embedding list and metadata list", async () => {
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
  it("should return a 200 response if embeddings list is shorter than document metadata list", async () => {
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
  it("should return a 200 response if metadata list is shorter than embedding list", async () => {
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
      error: { error_message: MISSING_DOCUMENT_IN_REQUEST_ERROR },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if axios post call fails", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      collection_name: MOCK_COLLECTION_NAME,
      embeddings: [
        [0.1, 0.2],
        [0.4, 0.3],
      ],
      documentMetadata: [
        { car: 1, horse: "neigh" },
        { car: 2, horse: "bleh" },
      ],
    };
    const mockInsertRequest = {
      collection_name: MOCK_COLLECTION_NAME,
      documents: [
        {
          embedding: [0.1, 0.2],
          metadata: { car: 1, horse: "neigh" },
        },
        {
          embedding: [0.4, 0.3],
          metadata: { car: 2, horse: "bleh" },
        },
      ],
    };
    const mockResponse: APIResult<TransposeAndInsertResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.post.mockRejectedValue(mockError);
    const actualResponse = await dbClient.columnInsert(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      DOCUMENTS_PATH,
      mockInsertRequest
    );
  });
});

describe("createCollection", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: 10,
    };
    const mockResponse = {
      data: {
        id: MOCK_COLLECTION_ID,
        name: MOCK_COLLECTION_NAME,
        dimensionality: 10,
      },
      error: null,
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.createCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      COLLECTIONS_PATH,
      mockRequest
    );
  });
  it("should return an error if collection name not specified", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: null,
      dimensionality: 10,
    };
    const mockResponse = {
      data: null,
      error: { error_message: CREATE_COLLECTION_MISSING_NAME_ERROR },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.createCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if dimensionality not specified", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: null,
    };
    const mockResponse = {
      data: null,
      error: { error_message: CREATE_COLLECTION_MISSING_DIMENSIONALITY_ERROR },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.createCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if dimensionality less than or equal to zero", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: 0,
    };
    const mockResponse = {
      data: null,
      error: { error_message: CREATE_COLLECTION_DIMENSIONALITY_LTE_ZERO_ERROR },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.createCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
  it("should return an error if axios post call fails", async () => {
    const MOCK_COLLECTION_NAME = "first collection test";
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      name: MOCK_COLLECTION_NAME,
      dimensionality: 20,
    };
    const mockResponse: APIResult<CreateCollectionResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.post.mockRejectedValue(mockError);
    const actualResponse = await dbClient.createCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      COLLECTIONS_PATH,
      mockRequest
    );
  });
});

describe("deleteCollection", () => {
  it("should return a 200 response", async () => {
    const MOCK_COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockRequest = {
      collection_id: MOCK_COLLECTION_ID,
    };
    const mockResponse = {
      data: {
        success: true,
      },
      error: null,
    };

    mockedAxios.delete.mockResolvedValue(mockResponse);
    const actualResponse = await dbClient.deleteCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.delete).toHaveBeenCalledWith(COLLECTIONS_PATH, {
      data: mockRequest,
    });
  });
  it("should return an error if axios delete call fails", async () => {
    const COLLECTION_ID = uuid4();
    const MOCK_API_KEY = uuid4();
    const dbClient = db.initialize(MOCK_API_KEY);
    const mockError = new Error(INTERNAL_SERVER_ERROR);
    const mockRequest = {
      collection_id: COLLECTION_ID,
    };
    const mockResponse: APIResult<DeleteCollectionResponse, ErrorResponse> = {
      data: null,
      error: { error_message: INTERNAL_SERVER_ERROR },
    };
    mockedAxios.delete.mockRejectedValue(mockError);
    const actualResponse = await dbClient.deleteCollection(mockRequest);
    expect(actualResponse).toEqual(mockResponse);
    expect(mockedAxios.delete).toHaveBeenCalledWith(COLLECTIONS_PATH, {
      data: mockRequest,
    });
  });
});
