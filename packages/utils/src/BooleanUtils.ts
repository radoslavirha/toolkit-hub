import _ from 'lodash';

/**
 * Utility class for boolean operations.
 */
export class BooleanUtils {
    /**
     * Checks if a value is a boolean. Acts as a type guard, narrowing the type to `boolean`
     * when the check returns true. Returns `false` for truthy/falsy non-boolean values.
     * @template T A generic value type.
     * @param value The value to check.
     * @returns `true` if the value is a primitive boolean or Boolean object, otherwise `false`.
     * @example
     * BooleanUtils.isBoolean(true);    // true
     * BooleanUtils.isBoolean(false);   // true
     * BooleanUtils.isBoolean(0);       // false (number, not boolean)
     * BooleanUtils.isBoolean('true');  // false (string, not boolean)
     * BooleanUtils.isBoolean(null);    // false
     */
    public static isBoolean<T>(value: T): value is Extract<T, boolean> {
        return _.isBoolean(value);
    }
}