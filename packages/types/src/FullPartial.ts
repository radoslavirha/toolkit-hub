/**
 * A utility type that makes all properties of T optional, including nested objects.
 */
export type FullPartial<T> = {
    [P in keyof T]?: T[P] extends object ? FullPartial<T[P]> : T[P];
};