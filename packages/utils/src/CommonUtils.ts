import _ from 'lodash';

/**
 * Utility class for common operations.
 */
export class CommonUtils {
    /**
     * Checks if the value is empty.
     * Returns true for empty objects, arrays, strings, maps, sets, or null/undefined.
     * @template T The type of value to check.
     * @param value The value to check for emptiness.
     * @returns True if value is empty, false otherwise.
     */
    public static isEmpty<T>(value: T): boolean {
        return _.isEmpty(value);
    }

    /**
     * Checks if the value is null or undefined.
     * @template T The type of value to check.
     * @param value The value to check.
     * @returns True if value is null or undefined, narrowing the type accordingly.
     */
    public static isNil<T>(value: T): value is Extract<T, null | undefined> {
        return _.isNil(value);
    }

    /**
     * Checks if the value is not null or undefined.
     * Type guard that narrows the type to exclude null and undefined.
     * @template T The type of value to check.
     * @param value The value to check.
     * @returns True if value is neither null nor undefined, narrowing to NonNullable<T>.
     */
    public static notNil<T>(value: T): value is NonNullable<T> {
        return !_.isNil(value);
    }

    /**
     * Checks if the value is null.
     * @template T The type of value to check.
     * @param value The value to check if is null.
     * @returns True if value is null, narrowing the type accordingly.
     */
    public static isNull<T>(value: T): value is Extract<T, null> {
        return _.isNull(value);
    }

    /**
     * Checks if the value is not null.
     * Type guard that narrows the type to exclude null.
     * @template T The type of value to check.
     * @param value The value to check if is not null.
     * @returns True if value is not null, narrowing to Exclude<T, null>.
     */
    public static notNull<T>(value: T): value is Exclude<T, null> {
        return !_.isNull(value);
    }

    /**
     * Checks if the value is undefined.
     * @template T The type of value to check.
     * @param value The value to check if is undefined.
     * @returns True if value is undefined, narrowing the type accordingly.
     */
    public static isUndefined<T>(value: T): value is Extract<T, undefined> {
        return _.isUndefined(value);
    }

    /**
     * Checks if the value is not undefined.
     * Type guard that narrows the type to exclude undefined.
     * @template T The type of value to check.
     * @param value The value to check if is not undefined.
     * @returns True if value is not undefined, narrowing to Exclude<T, undefined>.
     */
    public static notUndefined<T>(value: T): value is Exclude<T, undefined> {
        return !_.isUndefined(value);
    }

    /**
     * Builds a model instance from a type and data.
     * Creates a new instance of the specified class and assigns the provided data to it.
     * @template T The type of the model to create.
     * @param type The constructor of the model class.
     * @param data The data to assign to the model instance.
     * @returns A new instance of the model with the data assigned.
     */
    public static buildModel<T extends object>(type: { new (): T }, data: Partial<T>): T {
        const instance = new type();
        return Object.assign(instance, data) as T;
    }
}
