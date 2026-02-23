/**
 * A utility type that represents a property that can be either a value of type `T` or `null`.
 * Prefer this over manually writing `T | null` to make nullability intent explicit.
 *
 * @template T The non-null value type.
 * @example
 * interface User {
 *   id: string;
 *   middleName: NullableProperty<string>; // explicitly nullable
 * }
 */
export type NullableProperty<T> = T | null;