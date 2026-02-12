import _ from 'lodash';
import { FullPartial } from '@radoslavirha/types';

/**
 * Utility class for object operations.
 */
export class ObjectUtils {
    /**
     * Creates a deep clone of an object, recursively copying all nested properties.
     * The cloned object is completely independent from the original.
     * @template T The type of the object to clone.
     * @param object The object to clone. Can be any type including arrays, objects, primitives.
     * @returns A deep clone of the object with no shared references.
     * @example
     * const original = { a: 1, b: { c: 2 } };
     * const clone = ObjectUtils.cloneDeep(original);
     * clone.b.c = 3; // Does not affect original.b.c
     * 
     * const arr = [1, [2, 3]];
     * const clonedArr = ObjectUtils.cloneDeep(arr); // [1, [2, 3]] (fully independent)
     */
    public static cloneDeep<T>(object: T): T {
        return _.cloneDeep(object);
    }

    /**
     * Performs a deep merge of two objects, combining properties recursively.
     * Arrays are concatenated rather than replaced. Returns a new object without mutating inputs.
     * @template T The type of the target object.
     * @param target The target object to merge into. This object is not mutated.
     * @param source The source object to merge from. Can be a partial version of T.
     * @returns A new object containing the merged properties from both objects.
     * @example
     * const target = { a: 1, b: { c: 2, d: 3 }, arr: [1, 2] };
     * const source = { b: { c: 5 }, arr: [3] };
     * const result = ObjectUtils.mergeDeep(target, source);
     * // result: { a: 1, b: { c: 5, d: 3 }, arr: [1, 2, 3] }
     * // Arrays are concatenated, nested properties are merged
     */
    public static mergeDeep<T>(target: T, source: FullPartial<T>): T {
        return _.mergeWith({}, target, source, (targetValue, sourceValue) => {
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                return [...targetValue, ...sourceValue];
            }

            return undefined;
        });
    }
}