import { NumberUtils } from '@radoslavirha/utils';
import { Type, useDecorators } from '@tsed/core';
import { AdditionalProperties, DateTime, Nullable, Property, Required } from '@tsed/schema';
import { NullableDateTime } from './NullableDateTime.js';
import { NullableOf } from './NullableOf.js';

export interface EnumMapOfOptions {
    /**
     * Name of the generated schema. It becomes the OpenAPI component name, so it must be unique
     * in the service. Reusing a name with a different enum, value type or options throws.
     */
    name: string;
    /** The map itself may be `null`. */
    nullable?: boolean;
    /** Every value may be `null` (scalars, `Date` and model classes). */
    nullableValues?: boolean;
    /** Keys are optional. By default every enum value must be present. */
    partial?: boolean;
}

const SCALARS: unknown[] = [String, Number, Boolean, BigInt];
// @tsed/json-mapper compiles property access as `obj.<key>`, so only identifier-like keys can be (de)serialized
const MAPPABLE_KEY = /^[A-Za-z_$][\w$]*$/;
const generated = new Map<string, { model: Type<unknown>; signature: string }>();

function enumValues(enumType: Record<string, string | number>): string[] {
    // numeric enums carry reverse mappings (value -> name); keep only the declared members
    return Object.keys(enumType)
        .filter(name => !NumberUtils.isNumber(enumType[enumType[name] as string]))
        .map(name => String(enumType[name]));
}

function valueDecorator(type: Type<unknown>, nullable: boolean): PropertyDecorator {
    if (type === Date) {
        return nullable ? NullableDateTime() : useDecorators(Property(Date), DateTime()) as PropertyDecorator;
    }
    if (SCALARS.includes(type)) {
        return nullable ? Nullable(type) : Property(type);
    }
    return nullable ? NullableOf(type as new (...args: never[]) => unknown) : Property(type);
}

/**
 * Generates (once per `name`) a model with one property per enum value, so OpenAPI lists every
 * key and validation is exact: unknown keys are rejected (`additionalProperties: false`) and,
 * unless `partial`, every key is required.
 *
 * Enum values must be identifier-like (`UPPER_SNAKE_CASE`, `camelCase`, …): @tsed/json-mapper
 * cannot map numeric or hyphenated property names, so those throw at decoration time instead
 * of failing on the first request.
 *
 * Use it directly where a class is needed (`@Returns(200, model)`), or through {@link EnumMapOf}.
 */
export function EnumMapModel(enumType: Record<string, string | number>, type: Type<unknown>, options: EnumMapOfOptions): Type<unknown> {
    const keys = enumValues(enumType);
    const unmappable = keys.filter(key => !MAPPABLE_KEY.test(key));
    if (unmappable.length > 0) {
        throw new Error(`EnumMapOf: "${options.name}" has keys @tsed/json-mapper cannot map (${unmappable.join(', ')}). Use identifier-like enum values (e.g. UPPER_SNAKE_CASE).`);
    }
    const signature = JSON.stringify({ keys, type: type.name, nullableValues: !!options.nullableValues, partial: !!options.partial });
    const existing = generated.get(options.name);
    if (existing) {
        if (existing.signature !== signature) {
            throw new Error(`EnumMapOf: the schema name "${options.name}" is already used for a different enum map (${existing.signature}).`);
        }
        return existing.model;
    }
    const model = { [options.name]: class {} }[options.name] as Type<unknown>;
    for (const key of keys) {
        valueDecorator(type, !!options.nullableValues)(model.prototype, key);
        if (!options.partial) {
            Required()(model.prototype, key);
        }
    }
    AdditionalProperties(false)(model);
    generated.set(options.name, { model, signature });
    return model;
}

/**
 * An object keyed by enum values, modelled as plain schema (see {@link EnumMapModel}).
 * The runtime value is an instance of the generated model (declare it as `Record<E, V>` or
 * `Partial<Record<E, V>>`); model values are class instances.
 *
 * @example
 * ```ts
 * @EnumMapOf(Color, Number, { name: 'ColorCounts' })
 * public counts: Record<Color, number>;
 *
 * @EnumMapOf(Color, Child, { name: 'ColorChildren', partial: true, nullable: true })
 * public children?: Partial<Record<Color, Child>> | null;
 * ```
 */
export function EnumMapOf(enumType: Record<string, string | number>, type: Type<unknown>, options: EnumMapOfOptions): PropertyDecorator {
    const model = EnumMapModel(enumType, type, options);
    return options.nullable ? NullableOf(model as new (...args: never[]) => unknown) : Property(model);
}
