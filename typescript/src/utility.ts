import axios from "axios";
import { APIResult, ErrorResponse } from "./common-types";

export function zip<T, U>(listA: T[], listB: U[]): [T, U][] {
  const length = Math.min(listA.length, listB.length);
  const result: [T, U][] = Array.from({ length }, (_pair, index) => {
    return [listA[index], listB[index]];
  });
  return result;
}

export const handleError = (err: any): APIResult<null> => {
  if (axios.isAxiosError(err)) {
    return {
      data: null,
      error: err?.response?.data,
    };
  }
  return {
    data: null,
    error: { error_message: err.message },
  };
};
