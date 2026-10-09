import { Type } from '@tsed/core';
import { mapSchema } from '../internal/mapSchema.js';

/** Options for {@link MapOf}. */
export interface MapOfOptions {
    /** Accept `null` for the whole map (`Map | null`). */
    nullable?: boolean;
    /** Accept `null` as a value (`Map<string, V | null>`). Scalar value types only. */
    nullableValues?: boolean;
    /**
     * Reject keys MongoDB cannot store: a key must not start with `$` or contain `.`
     * (Mongoose otherwise fails with a 500 on save).
     */
    mongoSafeKeys?: boolean;
}

/** `propertyNames` pattern for {@link MapOfOptions.mongoSafeKeys}. */
export const MONGO_SAFE_KEY_PATTERN = '^(?!\\$)[^.]+$';

/**
 * Declares a `Map<string, V>` property, with the collection type set explicitly.
 *
 * Input is a JSON object, deserialized to a real `Map` (model values to class instances) and
 * serialized back to an object. Never relies on `design:type`, which is `Object` for `Map | null`.
 *
 * @param type - The value type (a model class or `String`, `Number`, `Boolean`, `Date`).
 * @param options - See {@link MapOfOptions}.
 *
 * @example
 * ```ts
 * \@MapOf(Number, { nullable: true, mongoSafeKeys: true })
 * scores!: Map<string, number> | null;
 * ```
 */
export function MapOf(type: Type<unknown>, options: MapOfOptions = {}): PropertyDecorator {
    return mapSchema(type, {
        nullable: options.nullable,
        nullableValues: options.nullableValues,
        propertyNames: options.mongoSafeKeys ? { type: 'string', pattern: MONGO_SAFE_KEY_PATTERN } : undefined
    });
}
