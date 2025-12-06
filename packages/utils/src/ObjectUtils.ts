import _ from 'lodash';
import { FullPartial } from '@radoslavirha/types';

/**
 * Utility class for object operations.
 */
export class ObjectUtils {
    /**
     * Deep clones an object.
     * @param object The object to clone.
     * @returns The cloned object.
     */
    public static cloneDeep<T>(object: T): T {
        return _.cloneDeep(object);
    }

    /**
     * Deep merges two objects.
     * @param target The target object to merge into.
     * @param source The source object to merge from.
     * @returns The merged object.
     */
    public static mergeDeep<T>(target: T, source: FullPartial<T>): T {
        return _.mergeWith({}, target, source, (targetValue, sourceValue) => {
            if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                return [...targetValue, ...sourceValue];
            }

            return undefined;
        });
    }
}