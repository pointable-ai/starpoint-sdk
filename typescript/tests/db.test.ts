import { db } from "../src/index";

jest.mock("../src/index", () => {
  return {
    db: {
      initialize: jest.fn(
        (apiKey, writerURL, readerURL) => {}
      ),
    },
  };
});

describe("initialize db", () => {
  it("should correctly set apiKey", () => {
    db.initialize("myApiKey");
    expect(db.initialize).toHaveBeenCalledTimes(1);
    expect(db.initialize).toHaveBeenCalledWith("myApiKey");
  });
});
