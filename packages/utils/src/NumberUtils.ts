export class NumberUtils {
    public static getPercentFromValue(maxValue: number = 100, value: number = 50): number {
        return (100 * value) / maxValue;
    }

    public static getValueFromPercent(maxValue: number = 100, percent: number = 50): number {
        return (maxValue * percent) / 100;
    }
}