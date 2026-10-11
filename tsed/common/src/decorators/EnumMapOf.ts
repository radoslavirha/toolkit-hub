import { NumberUtils } from '@radoslavirha/utils';
import { Type } from '@tsed/core';
import { mapSchema } from '../internal/mapSchema.js';

/** Options for {@link EnumMapOf}. */
export interface EnumMapOfOptions {
    /** Accept `null` for the whole map (`Map | null`). */
    nullable?: boolean;
    /** Accept `null` as a value. Scalar value types only. */
    nullableValues?: boolean;
    /** Allow a subset of the enum values as keys. By default every enum value must be present. */
    partial?: boolean;
}

/**
 * Declares a `Map<E, V>` property whose keys must be values of the enum `enumType`.
 *
 * Unknown keys are rejected and every enum value must be present (expressed as `minProperties`,
 * because `required` on a property schema is dropped by Ts.ED). With `partial`, a subset is accepted.
 * The collection type is set explicitly, never taken from `design:type`.
 *
 * @param enumType - The enum object (string or numeric; keys are compared as JSON strings).
 * @param type - The value type (a model class or `String`, `Number`, `Boolean`, `Date`).
 * @param options - See {@link EnumMapOfOptions}.
 *
 * @example
 * ```ts
 * \@EnumMapOf(Color, Number, { partial: true })
 * counts!: Map<Color, number>;
 * ```
 */
export function EnumMapOf(enumType: Record<string, string | number>, type: Type<unknown>, options: EnumMapOfOptions = {}): PropertyDecorator {
    // numeric enums carry reverse mappings (value -> name); keep only the declared members
    const keys = Object.keys(enumType)
        .filter(name => !NumberUtils.isNumber(enumType[enumType[name] as string]))
        .map(name => String(enumType[name]));
    return mapSchema(type, {
        nullable: options.nullable,
        nullableValues: options.nullableValues,
        propertyNames: { enum: keys },
        minProperties: options.partial ? undefined : keys.length
    });
}
