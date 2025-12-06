import _ from 'lodash';
import { ObjectUtils } from './ObjectUtils.js';

/**
 * Utility class for common operations.
 */
export class CommonUtils {
    /**
     * Clones an object deeply.
     * @deprecated Use ObjectUtils.cloneDeep instead.
     * @param obj The object to clone.
     * @returns The cloned object.
     */
    public static cloneDeep<T>(obj: T): T {
        return ObjectUtils.cloneDeep(obj);
    }

    /**
     * Checks if the value is empty.
     * @param value
     * @returns 
     */
    public static isEmpty<T>(value: T): boolean {
        return _.isEmpty(value);
    }

    /**
     * Checks if the value is null or undefined.
     * @param value
     * @returns 
     */
    public static isNil<T>(value: T): boolean {
        return _.isNil(value);
    }

    /**
     * Checks if the value is not null or undefined.
     * @param value
     * @returns 
     */
    public static notNil<T>(value: T): value is NonNullable<T> {
        return !_.isNil(value);
    }

    /**
     * Checks if the value is undefined.
     * @param value The value to check if is undefined.
     * @returns True/false response.
     */
    public static isUndefined<T>(value: T): boolean {
        return _.isUndefined(value);
    }

    /**
     * Checks if the value is not undefined.
     * @param value The value to check if is not undefined.
     * @returns True/false response.
     */
    public static notUndefined<T>(value: T): boolean {
        return !_.isUndefined(value);
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
