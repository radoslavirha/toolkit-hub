/**
 * A generic dictionary type mapping string keys to values of type `T`.
 * This is a drop-in replacement for lodash's `Dictionary<T>`.
 *
 * @template T The type of the dictionary values.
 * @example
 * const scores: Dictionary<number> = { alice: 10, bob: 20 };
 */
export type Dictionary<T> = { [index: string]: T };
