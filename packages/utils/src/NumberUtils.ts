import _ from 'lodash';

/**
 * Utility class for number operations.
 */
export class NumberUtils {
    /**
     * Calculates the percentage of a value in relation to a maximum value.
     * @param maxValue The maximum value.
     * @param value The value.
     * @returns The percentage.
     */
    public static getPercentFromValue(maxValue: number = 100, value: number = 50): number {
        return (100 * value) / maxValue;
    }

    /**
     * Calculates the value from a percentage in relation to a maximum value.
     * @param maxValue The maximum value.
     * @param percent The percentage.
     * @returns The value.
     */
    public static getValueFromPercent(maxValue: number = 100, percent: number = 50): number {
        return (maxValue * percent) / 100;
    }

    /**
     * Calculates the mean value of an array of numbers.
     * @param values The array of numbers.
     * @returns The mean value.
     */
    public static mean(values: number[]): number {
        return _.mean(values);
    }

    /**
     * Rounds a number to a specified precision.
     * @param value The number to round.
     * @param precision The precision.
     * @returns The rounded number.
     */
    public static round(value: number, precision: number = 0): number {
        return _.round(value, precision);
    }

    /**
     * Floors a number to a specified precision.
     * @param value The number to floor.
     * @param precision The precision.
     * @returns The floored number.
     */
    public static floor(value: number, precision: number = 0): number {
        return _.floor(value, precision);
    }

    /**
     * Ceils a number to a specified precision.
     * @param value The number to ceil.
     * @param precision The precision.
     * @returns The ceiled number.
     */
    public static ceil(value: number, precision: number = 0): number {
        return _.ceil(value, precision);
    }

    /**
     * Returns the minimum value of an array of numbers.
     * @param values The array of numbers.
     * @returns The minimum value.
     */
    public static min(values: number[]): number {
        return _.min(values)!;
    }

    /**
     * Returns the maximum value of an array of numbers.
     * @param values The array of numbers.
     * @returns The maximum value.
     */
    public static max(values: number[]): number {
        return _.max(values)!;
    }
}