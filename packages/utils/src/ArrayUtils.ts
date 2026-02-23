import _ from 'lodash';
import { CommonUtils } from './CommonUtils.js';

/**
 * Utility class for array operations.
 */
export class ArrayUtils {
    /**
     * Checks if a value is an array. Acts as a type guard, narrowing the type to an array
     * when the check returns true.
     * @template T A generic value type.
     * @param value The value to check.
     * @returns `true` if the value is an array, otherwise `false`.
     * @example
     * ArrayUtils.isArray([1, 2, 3]); // true
     * ArrayUtils.isArray('string');   // false
     * ArrayUtils.isArray(null);       // false
     */
    public static isArray<T>(value: T): value is Extract<T, unknown[]> {
        return _.isArray(value);
    }

    /**
     * Converts a value to an array, ensuring the result is always a non-null array.
     * - If the value is `null` or `undefined`, an empty array is returned.
     * - If the value is already an array, it is returned as-is.
     * - Otherwise, the value is wrapped in a single-element array.
     * @template T The element type.
     * @param value A single value, an array of values, or `null`/`undefined`.
     * @returns An array of type `T[]`, or `never[]` when the input is `null`/`undefined`.
     * @example
     * ArrayUtils.toArray(undefined);    // []
     * ArrayUtils.toArray(null);         // []
     * ArrayUtils.toArray('hello');      // ['hello']
     * ArrayUtils.toArray([1, 2, 3]);    // [1, 2, 3] (unchanged)
     */
    public static toArray(value: null | undefined): never[];
    public static toArray<T>(value: T | T[]): T[];
    public static toArray<T>(value: T | T[] | undefined | null): T[] {
        if (CommonUtils.isNil(value)) {
            return [];
        } else if (ArrayUtils.isArray(value)) {
            return value as T[];
        } else {
            return [value] as T[];
        }
    }
}