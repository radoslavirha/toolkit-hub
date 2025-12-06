import _ from 'lodash';

/**
 * Utility class for setting default values.
 */
export class DefaultsUtil {
    /**
     * Checks if a string is undefined and returns a default value if it is.
     * @param string The string to check.
     * @param defaultValue The default value to return if the string is undefined.
     * @returns The original string or the default value.
     */
    public static string(string: string | undefined | null, defaultValue: string): string {
        return _.isNil(string) || _.isEmpty(string) ? defaultValue : string;
    }

    /**
     * Checks if a number is undefined and returns a default value if it is.
     * @param number The number to check.
     * @param defaultValue The default value to return if the number is undefined.
     * @returns The original number or the default value.
     */
    public static number(number: number | undefined | null, defaultValue: number): number {
        return _.isNil(number) ? defaultValue : number;
    }
}
