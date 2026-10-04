/**
 * A utility type that makes all properties of T optional, including nested objects.
 * Distributes over unions, so optional (`X | undefined`) and nullable (`X | null`)
 * nested objects are made partial too.
 */
export type FullPartial<T> = T extends object ? { [P in keyof T]?: FullPartial<T[P]> } : T;