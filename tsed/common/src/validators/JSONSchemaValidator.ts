import { Type } from '@tsed/core';
import { getJsonSchema } from '@tsed/schema';
import { Ajv, Options } from 'ajv';
import { Serializer } from '../serializer/Serializer.js';

export class JSONSchemaValidator {
    private static readonly AJV_OPTIONS: Options = { allErrors: true };

    /**
     * Validates and deserializes arbitrary input against the JSON Schema derived
     * from a Ts.ED model decorated with `@tsed/schema` decorators.
     *
     * The input is first deserialized into a typed `T` instance via {@link Serializer},
     * then validated against the compiled AJV schema. All validation errors are
     * collected (`allErrors: true`) before throwing, so callers receive the full
     * picture in one shot.
     *
     * @template T The target model type (must extend `object`).
     * @param model The Ts.ED model class whose decorators define the JSON Schema.
     * @param input Arbitrary raw input to deserialize and validate (typically a plain object from JSON).
     * @param debug When `true`, logs the raw input and the generated JSON Schema to `console.log`.
     * @returns The deserialized, validated `T` instance.
     * @throws {ErrorObject[]} Array of AJV {@link ErrorObject} items when validation fails.
     *
     * @example
     * ```typescript
     * import { Required, Property } from '@tsed/schema';
     * import { JSONSchemaValidator } from '@radoslavirha/tsed-common';
     *
     * class UserInput {
     *     \@Required()
     *     name!: string;
     *
     *     \@Property()
     *     age?: number;
     * }
     *
     * // Valid – returns a typed UserInput instance
     * const user = JSONSchemaValidator.validate(UserInput, { name: 'Alice', age: 30 });
     *
     * // Invalid – throws ErrorObject[]
     * try {
     *     JSONSchemaValidator.validate(UserInput, { age: 30 });
     * } catch (errors: unknown) {
     *     if (Array.isArray(errors)) {
     *         errors.forEach(e => console.error(e.instancePath, e.message));
     *     }
     * }
     * ```
     */
    public static validate<T extends object>(model: Type<T>, input: unknown, debug = false): T {
        const ajv = new Ajv(JSONSchemaValidator.AJV_OPTIONS);

        if (debug) {
            console.log('Raw data:', JSON.stringify(input, null, 2));
        }

        // Generate JSON Schema from model decorators
        const schema = getJsonSchema(model);
        
        if (debug) {
            console.log('Generated JSON Schema:', JSON.stringify(schema, null, 2));
        }

        // Deserialize once to get typed instance
        const deserializedConfig = Serializer.deserialize<T>(input as T, model);

        // Validate against schema
        const validate = ajv.compile(schema);
        const isValid = validate(deserializedConfig);

        if (!isValid) {
            throw validate.errors;
        }

        return deserializedConfig;
    }
}