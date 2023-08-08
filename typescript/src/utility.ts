import { APIResult } from "./common-types";

export function zip<T, U>(listA: T[], listB: U[]): [T, U][] {
  const length = Math.min(listA.length, listB.length);
  const result: [T, U][] = Array.from({ length }, (_pair, index) => {
    return [listA[index], listB[index]];
  });
  return result;
}

export const handleError = async (err: any): Promise<APIResult<null>> => {
  if (err.name === "HTTPError") {
    return {
      data: null,
      error: await err.response.json(),
    };
  }
  return {
    data: null,
    error: { error_message: err.message },
  };
};
