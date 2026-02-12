import _ from 'lodash';

/**
 * Utility class for number operations.
 */
export class NumberUtils {
    /**
     * Calculates the percentage of a value in relation to a maximum value.
     * @param maxValue The maximum value to use as 100%. Defaults to 100.
     * @param value The value to calculate the percentage for. Defaults to 50.
     * @returns The percentage that the value represents of the maximum value.
     * @example
     * NumberUtils.getPercentFromValue(200, 50) // returns 25 (50 is 25% of 200)
     * NumberUtils.getPercentFromValue(100, 75) // returns 75 (75 is 75% of 100)
     * NumberUtils.getPercentFromValue() // returns 50 (default: 50 is 50% of 100)
     */
    public static getPercentFromValue(maxValue: number = 100, value: number = 50): number {
        return (100 * value) / maxValue;
    }

    /**
     * Calculates the value from a percentage in relation to a maximum value.
     * @param maxValue The maximum value that represents 100%. Defaults to 100.
     * @param percent The percentage to calculate the value for. Defaults to 50.
     * @returns The calculated value based on the percentage of the maximum value.
     * @example
     * NumberUtils.getValueFromPercent(200, 50) // returns 100 (50% of 200)
     * NumberUtils.getValueFromPercent(80, 25) // returns 20 (25% of 80)
     * NumberUtils.getValueFromPercent() // returns 50 (default: 50% of 100)
     */
    public static getValueFromPercent(maxValue: number = 100, percent: number = 50): number {
        return (maxValue * percent) / 100;
    }

    /**
     * Calculates the mean (average) value of an array of numbers.
     * @param values The array of numbers to calculate the mean from.
     * @returns The arithmetic mean of all values in the array.
     * @example
     * NumberUtils.mean([1, 2, 3, 4, 5]) // returns 3
     * NumberUtils.mean([10, 20]) // returns 15
     * NumberUtils.mean([100]) // returns 100
     */
    public static mean(values: number[]): number {
        return _.mean(values);
    }

    /**
     * Rounds a number to a specified number of decimal places.
     * @param value The number to round.
     * @param precision The number of decimal places to round to. Defaults to 0 (integer).
     * @returns The rounded number.
     * @example
     * NumberUtils.round(3.14159, 2) // returns 3.14
     * NumberUtils.round(1.5) // returns 2
     * NumberUtils.round(1234.5678, -2) // returns 1200 (rounds to nearest hundred)
     */
    public static round(value: number, precision: number = 0): number {
        return _.round(value, precision);
    }

    /**
     * Rounds a number down to a specified number of decimal places.
     * @param value The number to floor.
     * @param precision The number of decimal places to floor to. Defaults to 0 (integer).
     * @returns The floored number.
     * @example
     * NumberUtils.floor(3.99, 1) // returns 3.9
     * NumberUtils.floor(1.9) // returns 1
     * NumberUtils.floor(1234.5678, -2) // returns 1200 (floors to nearest hundred)
     */
    public static floor(value: number, precision: number = 0): number {
        return _.floor(value, precision);
    }

    /**
     * Rounds a number up to a specified number of decimal places.
     * @param value The number to ceil.
     * @param precision The number of decimal places to ceil to. Defaults to 0 (integer).
     * @returns The ceiled number.
     * @example
     * NumberUtils.ceil(3.01, 1) // returns 3.1
     * NumberUtils.ceil(1.1) // returns 2
     * NumberUtils.ceil(1234.5678, -2) // returns 1300 (ceils to nearest hundred)
     */
    public static ceil(value: number, precision: number = 0): number {
        return _.ceil(value, precision);
    }

    /**
     * Returns the minimum value from an array of numbers.
     * @param values The array of numbers to search.
     * @returns The minimum value in the array, or undefined if the array is empty.
     * @example
     * NumberUtils.min([1, 2, 3, 4, 5]) // returns 1
     * NumberUtils.min([10, -5, 20]) // returns -5
     * NumberUtils.min([42]) // returns 42
     */
    public static min(values: number[]): number | undefined {
        return _.min(values);
    }

    /**
     * Returns the maximum value from an array of numbers.
     * @param values The array of numbers to search.
     * @returns The maximum value in the array, or undefined if the array is empty.
     * @example
     * NumberUtils.max([1, 2, 3, 4, 5]) // returns 5
     * NumberUtils.max([10, -5, 20]) // returns 20
     * NumberUtils.max([42]) // returns 42
     */
    public static max(values: number[]): number | undefined {
        return _.max(values);
    }
}