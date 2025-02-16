import _ from 'lodash';

/**
 * Utility class for common operations.
 */
export class CommonUtils {
    /**
     * Clones an object deeply.
     * @param obj The object to clone.
     * @returns The cloned object.
     */
    public static cloneDeep<T>(obj: T): T {
        return _.cloneDeep(obj);
    }

    /**
     * Checks if the value is undefined.
     * @param value The value to check if is undefined.
     * @returns True/false response.
     */
    public static isUndefined<T>(value?: T): boolean {
        return _.isUndefined(value);
    }

    /**
     * Builds a model instance from a type and data.
     * @param type The type of the model.
     * @param data The data to assign to the model.
     * @returns The model instance.
     */
    public static buildModel<T extends object>(type: { new (): T }, data: Partial<T>): T {
        const instance = new type();
        return Object.assign(instance, data) as T;
    }
}
