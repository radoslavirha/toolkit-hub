import _ from 'lodash';
import { Dictionary } from '@radoslavirha/types';
import { ArrayUtils } from './ArrayUtils.js';
import { CommonUtils } from './CommonUtils.js';

/**
 * Represents T with the `enabled` property narrowed to the literal `true`.
 * All other properties of T are preserved as-is.
 * Produced by `ObjectUtils.isEnabled` when the type guard passes.
 * @template T The source type, must have an optional `enabled: boolean` field.
 * @example
 * class Feature {
 *   constructor(public name: string, public enabled?: boolean) {}
 * }
 *
 * function activate(feature: Enabled<Feature>) {
 *   console.log(feature.enabled); // type: true
 *   console.log(feature.name);    // type: string
 * }
 *
 * const f = new Feature('dark-mode', true);
 * if (ObjectUtils.isEnabled(f)) {
 *   activate(f); // safe — TypeScript knows enabled is true
 * }
 */
export type Enabled<T extends { enabled?: boolean }> = T & { enabled: true };

/**
 * Utility class for object operations.
 */
export class ObjectUtils {
    /**
     * Checks if value is the language type of Object, e.g.: arrays, functions, objects, regexes, new Number(0),
     * and new String('').
     * @template T A generic value type.
     * @param {T} value The value to be checked.
     * @returns {boolean}
     */
    public static isObject<T>(value: T): value is Extract<T, object> {
        return _.isObject(value);
    }

    /**
     * Checks if value is a plain object (POJO), excluding arrays, functions, dates, etc.
     * @template T A generic value type.
     * @param {T} value The value to be checked.
     * @returns {boolean}
     */
    public static isPlainObject<T>(value: T): value is Extract<T, Record<string, unknown>> {
        return _.isPlainObject(value);
    }

    /**
     * Returns the enumerable property names of an object with type safety.
     * When passed a typed object, returns strongly typed keys. When passed a dictionary, returns string keys.
     * Handles null and undefined gracefully by returning an empty array.
     * @template T The type of the object.
     * @param object The object to extract keys from. Can be typed objects or dictionaries.
     * @returns An array of the object's enumerable property keys. For typed objects, keys are strongly typed.
     * @example
     * const config = { host: 'localhost', port: 3000 };
     * const keys = ObjectUtils.keys(config); // ['host', 'port'] with type: ('host' | 'port')[]
     * 
     * const nullable = null;
     * const nullKeys = ObjectUtils.keys(nullable); // [] (empty array)
     * 
     * const dictionary: Record<string, number> = { a: 1, b: 2 };
     * const dictKeys = ObjectUtils.keys(dictionary); // ['a', 'b'] with type: string[]
     */
    public static keys<T extends object>(object: T | null | undefined): Array<Extract<keyof T, string>>;
    public static keys<T>(object: Dictionary<T> | null | undefined): string[];
    public static keys(object: unknown): string[] {
        return _.keys(object);
    }

    /**
     * Returns the enumerable property values of an object with type safety.
     * When passed a typed object, returns strongly typed values. When passed a dictionary, returns typed values.
     * Handles null and undefined gracefully by returning an empty array.
     * @template T The type of the object.
     * @param object The object to extract values from. Can be typed objects or dictionaries.
     * @returns An array of the object's enumerable property values. For typed objects, values are strongly typed.
     * @example
     * const config = { host: 'localhost', port: 3000 };
     * const vals = ObjectUtils.values(config); // ['localhost', 3000] with type: (string | number)[]
     *
     * // Works great with enums
     * enum Direction { Up = 'UP', Down = 'DOWN' }
     * const dirValues = ObjectUtils.values(Direction); // ['UP', 'DOWN'] with type: string[]
     *
     * const nullable = null;
     * const nullVals = ObjectUtils.values(nullable); // [] (empty array)
     *
     * const dictionary: Record<string, number> = { a: 1, b: 2 };
     * const dictVals = ObjectUtils.values(dictionary); // [1, 2] with type: number[]
     */
    public static values<T extends object>(object: T | null | undefined): Array<T[keyof T]>;
    public static values<T>(object: Dictionary<T> | null | undefined): T[];
    public static values(object: unknown): unknown[] {
        return _.values(object);
    }

    /**
     * Creates a deep clone of an object, recursively copying all nested properties.
     * The cloned object is completely independent from the original.
     * @template T The type of the object to clone, must be an object.
     * @param object The object to clone. Can be any object type including arrays, class instances, dates, maps, sets.
     * @returns A deep clone of the object with no shared references.
     * @example
     * const original = { a: 1, b: { c: 2 } };
     * const clone = ObjectUtils.cloneDeep(original);
     * clone.b.c = 3; // Does not affect original.b.c
     * 
     * const arr = [1, [2, 3]];
     * const clonedArr = ObjectUtils.cloneDeep(arr); // [1, [2, 3]] (fully independent)
     */
    public static cloneDeep<T extends object>(object: T): T {
        return _.cloneDeep(object);
    }

    /**
     * Performs a deep merge of two objects, combining properties recursively.
     * Arrays are concatenated rather than replaced. Returns a new object without mutating inputs.
     * @template T The type of the target object, must be an object.
     * @template S The type of the source object.
     * @param target The target object to merge into. This object is not mutated.
     * @param source The source object to merge from. May be any object — can contain a partial subset of T's properties or introduce new keys at any depth.
     * @returns A new object of type `T & S` containing the merged properties from both objects.
     * @example
     * const target = { a: 1, b: { c: 2, d: 3 }, arr: [1, 2] };
     * const source = { b: { c: 5 }, arr: [3] };
     * const result = ObjectUtils.mergeDeep(target, source);
     * // result: { a: 1, b: { c: 5, d: 3 }, arr: [1, 2, 3] }
     * // Arrays are concatenated, nested properties are merged
     */
    public static mergeDeep<T extends object, S extends object>(target: T, source: S): T & S {
        return _.mergeWith({}, target, source, (targetValue, sourceValue) => {
            if (ArrayUtils.isArray(targetValue) && ArrayUtils.isArray(sourceValue)) {
                return [...targetValue, ...sourceValue];
            }

            return undefined;
        });
    }

    /**
     * Checks if the value exists and has `enabled` set to `true`.
     * Returns `false` for `null`, `undefined`, `enabled: false`, and `enabled: undefined`.
     * When it returns `true`, TypeScript narrows the type to `Enabled<T>` — i.e. T with `enabled: true`.
     * @template T The type of value to check, must have an optional `enabled: boolean` field.
     * @param value The value to check. May be `null` or `undefined`.
     * @returns `true` if the value is non-null/undefined and `enabled === true`, narrowing to `Enabled<T>`.
     * @example
     * class Feature {
     *   constructor(public name: string, public enabled?: boolean) {}
     * }
     *
     * const f = new Feature('dark-mode', true);
     * if (ObjectUtils.isEnabled(f)) {
     *   f.enabled; // type: true
     *   f.name;    // type: string
     * }
     *
     * ObjectUtils.isEnabled(new Feature('x', false));  // false
     * ObjectUtils.isEnabled(new Feature('x'));          // false (enabled is undefined)
     * ObjectUtils.isEnabled(null);                      // false
     * ObjectUtils.isEnabled(undefined);                 // false
     *
     * // Works on nested objects:
     * class Parent {
     *   constructor(public child: Feature | null) {}
     * }
     * const p = new Parent(new Feature('child', true));
     * if (ObjectUtils.isEnabled(p.child)) {
     *   p.child.enabled; // type: true
     * }
     */
    public static isEnabled<T extends { enabled?: boolean }>(value: T | null | undefined): value is Enabled<T> {
        return CommonUtils.notNil(value) && value.enabled === true;
    }
}