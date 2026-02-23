import _ from 'lodash';

/**
 * Utility class for string operations.
 */
export class StringUtils {
    /**
     * Checks if a value is a string. Acts as a type guard, narrowing the type to `string`
     * when the check returns true. Works for both primitive strings and String objects.
     * @template T A generic value type.
     * @param value The value to check.
     * @returns `true` if the value is a primitive string or String object, otherwise `false`.
     * @example
     * StringUtils.isString('hello');    // true
     * StringUtils.isString('');         // true (empty string is still a string)
     * StringUtils.isString(42);         // false
     * StringUtils.isString(null);       // false
     * StringUtils.isString(undefined);  // false
     */
    public static isString<T>(value: T): value is Extract<T, string> {
        return _.isString(value);
    }
}
