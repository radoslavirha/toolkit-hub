import { useDecorators } from '@tsed/core';
import { defineSchemaMapper, JsonEntityFn, type JsonSchema, Nullable, nullableMapperOpenApi, SpecTypes } from '@tsed/schema';

const nullableOfSchemas = new WeakSet<JsonSchema>();

// Ts.ED renders a nullable model as `oneOf: [{ $ref }, { nullable: true }]` in OpenAPI 3.0, and
// `{ nullable: true }` without a type matches anything. Only schemas marked by NullableOf are
// rendered as `allOf: [{ $ref }], nullable: true`; everything else keeps Ts.ED's output.
defineSchemaMapper({
    type: 'nullable',
    spec: [SpecTypes.OPENAPI, SpecTypes.SWAGGER],
    transform: (obj, schema, options) => {
        if (schema && nullableOfSchemas.has(schema) && obj.$ref && options.specVersion !== '3.1.0') {
            const { $ref, ...rest } = obj;
            return { ...rest, allOf: [{ $ref }], nullable: true };
        }
        return nullableMapperOpenApi(obj, schema, options);
    }
});

/**
 * A property that is a model instance, or `null`, with a valid OpenAPI 3.0 schema.
 *
 * `@Nullable(Child)` validates correctly but is documented as `oneOf: [{ $ref }, { nullable: true }]`,
 * which matches anything and gives generated clients odd types. `NullableOf(Child)` validates the
 * same way (`oneOf: [{ type: "null" }, { $ref }]` in JSON Schema) and is documented as
 * `allOf: [{ $ref }], nullable: true` in OpenAPI 3.0.
 *
 * @param model - The model class.
 *
 * @example
 * ```ts
 * \@NullableOf(Address)
 * address?: Address | null;
 * ```
 */
export function NullableOf(model: new (...args: never[]) => unknown): PropertyDecorator {
    return useDecorators(
        Nullable(model),
        JsonEntityFn(store => {
            nullableOfSchemas.add(store.itemSchema);
        })
    );
}
