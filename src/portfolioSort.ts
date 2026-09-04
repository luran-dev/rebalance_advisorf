export type SortDirection = "desc" | "asc";
export type SortState<Key extends string> = {
  readonly key: Key;
  readonly direction: SortDirection;
};

export const nextSortDirection = (direction: SortDirection): SortDirection =>
  direction === "desc" ? "asc" : "desc";

export const sortByNumber = <T>(
  rows: readonly T[],
  valueOf: (row: T) => number,
  direction: SortDirection,
): readonly T[] =>
  [...rows].sort((left, right) =>
    direction === "desc" ? valueOf(right) - valueOf(left) : valueOf(left) - valueOf(right),
  );

export const nextSortState = <Key extends string>(
  current: SortState<Key>,
  key: Key,
): SortState<Key> => ({
  key,
  direction: current.key === key ? nextSortDirection(current.direction) : "desc",
});
