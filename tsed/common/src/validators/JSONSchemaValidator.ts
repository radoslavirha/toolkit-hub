import { Type } from '@tsed/core';
import { getJsonSchema } from '@tsed/schema';
import { Ajv, Options } from 'ajv';
import formatsPlugin from 'ajv-formats';
import { Serializer } from '../serializer/Serializer.js';

// ajv-formats is CJS; under nodenext the default import is the module object
const addFormats = formatsPlugin as unknown as typeof formatsPlugin.default;

export class JSONSchemaValidator {
    private static readonly AJV_OPTIONS: Options = { allErrors: true, discriminator: true };

    /**
     * Validates and deserializes arbitrary input against the JSON Schema derived
     * from a Ts.ED model decorated with `@tsed/schema` decorators.
     *
     * The raw input is first validated against the compiled AJV schema (with the
     * standard `ajv-formats` formats such as `date-time` and `email` registered),
     * then deserialized into a typed `T` instance via {@link Serializer}. Values are
     * not coerced before validation, so wrong-typed input is rejected. All validation errors are
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
        addFormats(ajv);

        if (debug) {
            console.log('Raw data:', JSON.stringify(input, null, 2));
        }

        // Generate JSON Schema from model decorators
        const schema = getJsonSchema(model);
        
        if (debug) {
            console.log('Generated JSON Schema:', JSON.stringify(schema, null, 2));
        }

        // Validate the raw input against schema
        const validate = ajv.compile(schema);
        const isValid = validate(input);

        if (!isValid) {
            throw validate.errors;
        }

        // Deserialize once to get typed instance
        return Serializer.deserialize<T>(input as T, model);
    }
}