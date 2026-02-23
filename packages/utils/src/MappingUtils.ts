import { CommonUtils } from './CommonUtils.js';
import { ObjectUtils } from './ObjectUtils.js';

/**
 * Maps values while preserving nullability from the input type.
 * - If input includes null, output includes null
 * - If input includes undefined, output includes undefined
 * - Otherwise, only the target type
 */
export type Result<TValue, TTarget> =
    (null extends TValue ? null : never) |
    (undefined extends TValue ? undefined : never) |
    (TValue extends null | undefined ? never : TTarget);

/**
 * Extracts the element type from an array type.
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Extracts the key type from a Map type.
 */
export type MapKey<T> = T extends Map<infer K, unknown> ? K : never;

/**
 * Extracts the value type from a Map type.
 */
export type MapValue<T> = T extends Map<unknown, infer V> ? V : never;

export class MappingUtils {
    /**
     * Resolves mapping between types. Preserves nullability from input type.
     * - Input: T → Output: T
     * - Input: T | null → Output: T | null
     * - Input: T | undefined → Output: T | undefined
     * - Input: T | null | undefined → Output: T | null | undefined
     * @param model Model to be mapped.
     * @param mapper Mapper function to be used for mapping.
     * @param mapperArgs Additional arguments for the mapper function.
     */
    public async mapOptionalModel<
        TValue extends object | null | undefined,
        TOut,
        TArgs extends unknown[] = []
    >(
        model: TValue,
        mapper: (model: NonNullable<TValue>, ...mapperArgs: TArgs) => Promise<TOut>,
        ...mapperArgs: TArgs
    ): Promise<Result<TValue, TOut>> {
        if (CommonUtils.isUndefined(model)) {
            return undefined as Result<TValue, TOut>;
        } else if (CommonUtils.isNull(model)) {
            return null as Result<TValue, TOut>;
        }
        return await mapper(model as NonNullable<TValue>, ...mapperArgs) as Result<TValue, TOut>;
    }

    /**
     * Resolves array mapping between types. Preserves nullability from input type.
     * - Input: T[] → Output: T[]
     * - Input: T[] | null → Output: T[] | null
     * Use mapOptionalArray for arrays that might be undefined.
     * @param models Array of models to be mapped.
     * @param mapper Mapper function to be used for mapping individual elements.
     * @param mapperArgs Additional arguments for the mapper function.
     */
    public async mapArray<
        TValue extends unknown[] | null,
        TOut,
        TArgs extends unknown[] = []
    >(
        models: TValue,
        mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>,
        ...mapperArgs: TArgs
    ): Promise<Result<TValue, TOut[]>> {
        if (CommonUtils.isNull(models)) {
            return null as Result<TValue, TOut[]>;
        }
        const promises = (models as ArrayElement<NonNullable<TValue>>[]).map(async model => mapper(model, ...mapperArgs));
        return (await Promise.all(promises)) as Result<TValue, TOut[]>;
    }

    /**
     * Resolves array mapping between types. Preserves nullability from input type.
     * - Input: T[] → Output: T[]
     * - Input: T[] | null → Output: T[] | null
     * - Input: T[] | undefined → Output: T[] | undefined
     * - Input: T[] | null | undefined → Output: T[] | null | undefined
     * @param models Array of models to be mapped.
     * @param mapper Mapper function to be used for mapping individual elements.
     * @param mapperArgs Additional arguments for the mapper function.
     */
    public async mapOptionalArray<
        TValue extends unknown[] | null | undefined,
        TOut,
        TArgs extends unknown[] = []
    >(
        models: TValue,
        mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>,
        ...mapperArgs: TArgs
    ): Promise<Result<TValue, TOut[]>> {
        if (CommonUtils.isUndefined(models)) {
            return undefined as Result<TValue, TOut[]>;
        } else if (CommonUtils.isNull(models)) {
            return null as Result<TValue, TOut[]>;
        }
        const promises = (models as ArrayElement<NonNullable<TValue>>[]).map(async model => mapper(model, ...mapperArgs));
        return (await Promise.all(promises)) as Result<TValue, TOut[]>;
    }

    /**
     * Resolves Map mapping between types. Preserves nullability from input type.
     * - Input: Map<K,V> → Output: Map<K,V>
     * - Input: Map<K,V> | null → Output: Map<K,V> | null
     * Use mapOptionalMap for maps that might be undefined.
     * @param source The input Map that will be converted.
     * @param mapper Mapper function to be used for mapping every Map entry.
     */
    public async mapMap<
        TValue extends Map<unknown, unknown> | null,
        TKeyOut,
        TValueOut
    >(
        source: TValue,
        mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>
    ): Promise<Result<TValue, Map<TKeyOut, TValueOut>>> {
        if (CommonUtils.isNull(source)) {
            return null as Result<TValue, Map<TKeyOut, TValueOut>>;
        }
        const mappingTasks: Promise<[TKeyOut, TValueOut]>[] = [];
        for (const [key, value] of source as Map<MapKey<NonNullable<TValue>>, MapValue<NonNullable<TValue>>>) {
            mappingTasks.push(
                mapper(key, value)
            );
        }
        return new Map<TKeyOut, TValueOut>(await Promise.all(mappingTasks)) as Result<TValue, Map<TKeyOut, TValueOut>>;
    }

    /**
     * Resolves Map mapping between types. Preserves nullability from input type.
     * - Input: Map<K,V> → Output: Map<K,V>
     * - Input: Map<K,V> | null → Output: Map<K,V> | null
     * - Input: Map<K,V> | undefined → Output: Map<K,V> | undefined
     * - Input: Map<K,V> | null | undefined → Output: Map<K,V> | null | undefined
     * @param source The input Map that will be converted.
     * @param mapper Mapper function to be used for mapping every Map entry.
     */
    public async mapOptionalMap<
        TValue extends Map<unknown, unknown> | null | undefined,
        TKeyOut,
        TValueOut
    >(
        source: TValue,
        mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>
    ): Promise<Result<TValue, Map<TKeyOut, TValueOut>>> {
        if (CommonUtils.isUndefined(source)) {
            return undefined as Result<TValue, Map<TKeyOut, TValueOut>>;
        } else if (CommonUtils.isNull(source)) {
            return null as Result<TValue, Map<TKeyOut, TValueOut>>;
        }
        const mappingTasks: Promise<[TKeyOut, TValueOut]>[] = [];
        for (const [key, value] of source as Map<MapKey<NonNullable<TValue>>, MapValue<NonNullable<TValue>>>) {
            mappingTasks.push(
                mapper(key, value)
            );
        }
        return new Map<TKeyOut, TValueOut>(await Promise.all(mappingTasks)) as Result<TValue, Map<TKeyOut, TValueOut>>;
    }

    /**
     * Maps any enum type into another. Preserves nullability from input type.
     * - Input: T → Output: T
     * - Input: T | null → Output: T | null
     * Use mapOptionalEnum for enum values that might be undefined.
     * @param sourceTypeObject The object wrapper containing source enum, e.g. {ApplicationIDDTO}
     * @param targetTypeObject The object wrapper containing target enum, e.g. {ApplicationID}
     * @param value A source enum value to be mapped to target.
     * @param ignoreUnknownKeys If true, the mapper does not throw errors on unknown keys, just maps it to undefined.
     */
    public mapEnum<
        TSource extends Record<string, string | number>,
        TTarget extends Record<string, string | number>,
        TValue extends TSource[keyof TSource] | null
    >(
        sourceTypeObject: Record<string, TSource>,
        targetTypeObject: Record<string, TTarget>,
        value: TValue,
        ignoreUnknownKeys: boolean = false
    ): Result<TValue, TTarget[keyof TTarget]> {
        return this.mapGenericEnum(
            sourceTypeObject,
            targetTypeObject,
            value,
            ignoreUnknownKeys
        ) as Result<TValue, TTarget[keyof TTarget]>;
    }

    /**
     * Maps any enum type into another. Preserves nullability from input type.
     * - Input: T → Output: T
     * - Input: T | null → Output: T | null
     * - Input: T | undefined → Output: T | undefined
     * - Input: T | null | undefined → Output: T | null | undefined
     * @param sourceTypeObject The object wrapper containing source enum, e.g. {ApplicationIDDTO}
     * @param targetTypeObject The object wrapper containing target enum, e.g. {ApplicationID}
     * @param value A source enum value to be mapped to target.
     * @param ignoreUnknownKeys If true, the mapper does not throw errors on unknown keys, just maps it to undefined.
     */
    public mapOptionalEnum<
        TSource extends Record<string, string | number>,
        TTarget extends Record<string, string | number>,
        TValue extends TSource[keyof TSource] | null | undefined
    >(
        sourceTypeObject: Record<string, TSource>,
        targetTypeObject: Record<string, TTarget>,
        value: TValue,
        ignoreUnknownKeys: boolean = false
    ): Result<TValue, TTarget[keyof TTarget]> {
        if (CommonUtils.isUndefined(value)) {
            return undefined as Result<TValue, TTarget[keyof TTarget]>;
        }
        // After undefined check, value is TSource[keyof TSource] | null
        return this.mapGenericEnum(
            sourceTypeObject,
            targetTypeObject,
            value as Exclude<TValue, undefined>,
            ignoreUnknownKeys
        ) as Result<TValue, TTarget[keyof TTarget]>;
    }
     
    private mapGenericEnum<
        TSource extends Record<string, string | number>,
        TTarget extends Record<string, string | number>
    >(
        sourceTypeObject: Record<string, TSource>,
        targetTypeObject: Record<string, TTarget>,
        value: TSource[keyof TSource] | null,
        ignoreUnknownKeys: boolean
    ): TTarget[keyof TTarget] | null | undefined {
        // Handle null values
        if (CommonUtils.isNull(value)) {
            return null;
        }

        // Extract enum names and objects from wrappers
        const sourceTypeName = Object.keys(sourceTypeObject)[0];
        const targetTypeName = Object.keys(targetTypeObject)[0];
        const source = sourceTypeObject[sourceTypeName] as TSource;
        const target = targetTypeObject[targetTypeName] as TTarget;

        if (CommonUtils.isUndefined(value)) {
            throw new Error(`The value "${String(value)}" is not a valid enum value so then cannot be mapped to target type ${sourceTypeName}.`);
        }

        const resultKey = ObjectUtils.keys(source).find((key) => source[key] === value);
        if (!resultKey && ignoreUnknownKeys) {
            // ignore unknown keys, if the flag was set
            return undefined;
        }

        if (!resultKey) {
            throw new Error(`The value "${String(value)}" doesn't exist in ${sourceTypeName} so then cannot be mapped to ${targetTypeName} type.`);
        }

        const result = target[resultKey!];
        if (CommonUtils.isNil(result) && !ignoreUnknownKeys) {
            throw new Error(`The value "${String(value)}" of ${sourceTypeName}.${resultKey} cannot be mapped to ${targetTypeName}.${resultKey}, it doesn't exist.`);
        }

        return result as TTarget[keyof TTarget];
    }
}
