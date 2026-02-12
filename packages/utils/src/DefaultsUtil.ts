import _ from 'lodash';

/**
 * Utility class for setting default values.
 */
export class DefaultsUtil {
    /**
     * Returns a default value if the string is null, undefined, or empty.
     * Combines null/undefined check with empty string check for convenience.
     * @param string The string value to check. Can be null, undefined, or a string.
     * @param defaultValue The default value to return if the string is null, undefined, or empty.
     * @returns The original string if it has content, otherwise the default value.
     * @example
     * DefaultsUtil.string(undefined, 'default') // returns 'default'
     * DefaultsUtil.string('', 'default') // returns 'default'
     * DefaultsUtil.string('value', 'default') // returns 'value'
     */
    public static string(string: string | undefined | null, defaultValue: string): string {
        return _.isNil(string) || _.isEmpty(string) ? defaultValue : string;
    }

    /**
     * Returns a default value if the number is null or undefined.
     * Note: 0 is considered a valid number and will not trigger the default.
     * @param number The number value to check. Can be null, undefined, or a number.
     * @param defaultValue The default value to return if the number is null or undefined.
     * @returns The original number if it exists (including 0), otherwise the default value.
     * @example
     * DefaultsUtil.number(undefined, 10) // returns 10
     * DefaultsUtil.number(null, 10) // returns 10
     * DefaultsUtil.number(0, 10) // returns 0
     * DefaultsUtil.number(5, 10) // returns 5
     */
    public static number(number: number | undefined | null, defaultValue: number): number {
        return _.isNil(number) ? defaultValue : number;
    }
}
