import { CommonUtils } from '@radoslavirha/utils';
import { Type, useDecorators } from '@tsed/core';
import { CollectionOf, JsonEntityFn, Schema } from '@tsed/schema';

const SCALARS: unknown[] = [String, Number, Boolean, Date, BigInt];

export interface MapSchemaOptions {
    nullable?: boolean;
    nullableValues?: boolean;
    propertyNames?: Record<string, unknown>;
    minProperties?: number;
}

/**
 * Builds the decorator shared by `MapOf` and `EnumMapOf`: an explicit `Map` collection plus
 * a hand-written schema, since Ts.ED's own collection decorators cannot express these.
 */
export function mapSchema(type: Type<unknown>, options: MapSchemaOptions): PropertyDecorator {
    if (options.nullableValues && !SCALARS.includes(type)) {
        // Ts.ED 8.x cannot emit a valid nullable `$ref` for an item schema (JSON Schema and OAS 3.0 alike)
        throw new Error('nullableValues is only supported for String, Number, Boolean, Date and BigInt values, not model classes.');
    }
    const schema: Record<string, unknown> = {};
    if (options.nullable) {
        schema.nullable = true;
    }
    if (options.propertyNames) {
        schema.propertyNames = options.propertyNames;
    }
    if (CommonUtils.notUndefined(options.minProperties)) {
        schema.minProperties = options.minProperties;
    }
    return useDecorators(
        CollectionOf(type, Map),
        Object.keys(schema).length > 0 ? Schema(schema) : undefined,
        options.nullableValues
            ? JsonEntityFn(store => {
                store.itemSchema.nullable(true);
            })
            : undefined
    ) as PropertyDecorator;
}
