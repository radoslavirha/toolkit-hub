import { getJsonSchema, Property, Required, SpecTypes } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { MapOf, MONGO_SAFE_KEY_PATTERN } from './MapOf.js';

class Child {
    @Property()
    name!: string;
}

class Target {
    @Required()
    @MapOf(Number)
    required!: Map<string, number>;

    @MapOf(Number, { nullable: true })
    nullable?: Map<string, number> | null;

    @MapOf(Number, { nullableValues: true })
    nullableValues?: Map<string, number | null>;

    @MapOf(Number, { mongoSafeKeys: true })
    safe?: Map<string, number>;

    @MapOf(Child)
    children?: Map<string, Child>;
}

describe('MapOf', () => {
    describe('schema', () => {
        it('emits additionalProperties for the value type', () => {
            const schema = getJsonSchema(Target);

            expect(schema.required).toStrictEqual(['required']);
            expect(schema.properties.required).toStrictEqual({ type: 'object', additionalProperties: { type: 'number' } });
            expect(schema.properties.children.additionalProperties).toStrictEqual({ $ref: '#/definitions/Child' });
        });

        it('emits nullable maps as type null in JSON Schema and nullable: true in OAS 3.0', () => {
            expect(getJsonSchema(Target).properties.nullable.type).toStrictEqual(['null', 'object']);
            expect(getJsonSchema(Target, { specType: SpecTypes.OPENAPI }).properties.nullable).toStrictEqual({
                type: 'object',
                additionalProperties: { type: 'number' },
                nullable: true
            });
        });

        it('emits nullable values on additionalProperties', () => {
            expect(getJsonSchema(Target).properties.nullableValues.additionalProperties.type).toStrictEqual(['null', 'number']);
            expect(getJsonSchema(Target, { specType: SpecTypes.OPENAPI }).properties.nullableValues.additionalProperties).toStrictEqual({
                type: 'number',
                nullable: true
            });
        });

        it('emits the mongo-safe propertyNames pattern', () => {
            expect(getJsonSchema(Target).properties.safe.propertyNames).toStrictEqual({ type: 'string', pattern: MONGO_SAFE_KEY_PATTERN });
        });

        it('rejects nullable values for model classes', () => {
            expect(() => MapOf(Child, { nullableValues: true })).toThrow(/nullableValues/);
        });
    });

    describe('validation', () => {
        it('accepts valid, empty and null maps', () => {
            expect(() => JSONSchemaValidator.validate(Target, { required: {} })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { required: { a: 1 }, nullable: null })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { required: {}, nullableValues: { a: null, b: 2 } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { required: {}, children: { a: { name: 'x' } } })).not.toThrow();
        });

        it.each([
            ['a missing required map', {}],
            ['null on a non-nullable map', { required: null }],
            ['an array instead of a map', { required: [] }],
            ['a wrong value type', { required: { a: 'x' } }],
            ['null values without nullableValues', { required: { a: null } }],
            ['a dotted key with mongoSafeKeys', { required: {}, safe: { 'a.b': 1 } }],
            ['a $-prefixed key with mongoSafeKeys', { required: {}, safe: { $a: 1 } }],
            ['a non-object model value', { required: {}, children: { a: 'x' } }]
        ])('rejects %s', (_label, input) => {
            expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
        });

        it('accepts dotted keys without mongoSafeKeys', () => {
            expect(() => JSONSchemaValidator.validate(Target, { required: { 'a.b': 1 } })).not.toThrow();
        });
    });

    describe('serialization', () => {
        it('deserializes to a Map with class instance values', () => {
            const result = JSONSchemaValidator.validate(Target, { required: { a: 1 }, children: { x: { name: 'n' } } });

            expect(result.required).toStrictEqual(new Map([['a', 1]]));
            expect(result.children?.get('x')).toBeInstanceOf(Child);
        });

        it('serializes a Map to an object, emitting null and omitting undefined', () => {
            const model = Object.assign(new Target(), { required: new Map([['a', 1]]), nullable: null });

            expect(Serializer.serialize(model, Target)).toStrictEqual({ required: { a: 1 }, nullable: null });
        });
    });
});
