/**
 * A utility type that makes all properties of T optional, including nested objects.
 * Distributes over unions, so optional (`X | undefined`) and nullable (`X | null`)
 * nested objects are made partial too. `Date`, `RegExp`, `Map`, `Set` and function types are left as they
 * are: mapping over them would produce a weak type that accepts almost any value.
 */
export type FullPartial<T> = T extends Date | RegExp | Map<unknown, unknown> | Set<unknown> | ((...args: never[]) => unknown)
    ? T
    : T extends object ? { [P in keyof T]?: FullPartial<T[P]> } : T;
