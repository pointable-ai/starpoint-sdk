export function zip<T, U>(listA: T[], listB: U[]): [T, U][] {
  const length = Math.min(listA.length, listB.length);
  const result: [T, U][] = Array.from({ length }, (_pair, index) => {
    return [listA[index], listB[index]];
  });
  return result;
}
