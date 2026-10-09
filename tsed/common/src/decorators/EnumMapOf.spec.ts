import { getJsonSchema, Property, Required, SpecTypes } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { EnumMapOf } from './EnumMapOf.js';

enum Color {
    Red = 'red',
    Blue = 'blue'
}

enum Level {
    Low,
    High
}

class Child {
    @Property()
    name!: string;
}

class Target {
    @Required()
    @EnumMapOf(Color, Number)
    partial!: Map<Color, number>;

    @EnumMapOf(Color, Number, { exhaustive: true })
    exhaustive?: Map<Color, number>;

    @EnumMapOf(Color, Number, { nullable: true, nullableValues: true })
    nullable?: Map<Color, number | null> | null;

    @EnumMapOf(Color, Child)
    children?: Map<Color, Child>;

    @EnumMapOf(Level, String)
    levels?: Map<Level, string>;
}

describe('EnumMapOf', () => {
    describe('schema', () => {
        it('restricts propertyNames to the enum values', () => {
            const schema = getJsonSchema(Target);

            expect(schema.required).toStrictEqual(['partial']);
            expect(schema.properties.partial).toStrictEqual({
                type: 'object',
                additionalProperties: { type: 'number' },
                propertyNames: { enum: ['red', 'blue'], type: 'string' }
            });
            expect(schema.properties.partial.minProperties).toBeUndefined();
        });

        it('uses minProperties for an exhaustive map', () => {
            expect(getJsonSchema(Target).properties.exhaustive.minProperties).toBe(2);
        });

        it('skips reverse mappings of a numeric enum', () => {
            expect(getJsonSchema(Target).properties.levels.propertyNames.enum).toStrictEqual(['0', '1']);
        });

        it('emits OAS 3.0 nullable on the map and its values', () => {
            const schema = getJsonSchema(Target, { specType: SpecTypes.OPENAPI }).properties.nullable;

            expect(schema.nullable).toBe(true);
            expect(schema.additionalProperties).toStrictEqual({ type: 'number', nullable: true });
            expect(schema.propertyNames.enum).toStrictEqual(['red', 'blue']);
        });
    });

    describe('validation', () => {
        it('accepts a subset of keys, an empty map and an exhaustive map', () => {
            expect(() => JSONSchemaValidator.validate(Target, { partial: {} })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { partial: { red: 1 }, exhaustive: { red: 1, blue: 2 } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { partial: {}, nullable: null })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { partial: {}, nullable: { red: null } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { partial: {}, levels: { 0: 'a' } })).not.toThrow();
        });

        it.each([
            ['an unknown enum key', { partial: { green: 1 } }],
            ['missing keys when exhaustive', { partial: {}, exhaustive: { red: 1 } }],
            ['an empty exhaustive map', { partial: {}, exhaustive: {} }],
            ['a wrong value type', { partial: { red: 'x' } }],
            ['null values without nullableValues', { partial: { red: null } }],
            ['null on a non-nullable map', { partial: null }],
            ['a missing required map', {}],
            ['a dotted key', { partial: { 'a.b': 1 } }]
        ])('rejects %s', (_label, input) => {
            expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
        });
    });

    describe('serialization', () => {
        it('deserializes to a Map with class instance values', () => {
            const result = JSONSchemaValidator.validate(Target, { partial: { red: 1 }, children: { blue: { name: 'n' } } });

            expect(result.partial).toStrictEqual(new Map([[Color.Red, 1]]));
            expect(result.children?.get(Color.Blue)).toBeInstanceOf(Child);
        });

        it('serializes null and omits undefined', () => {
            const model = Object.assign(new Target(), { partial: new Map([[Color.Red, 1]]), nullable: null });

            expect(Serializer.serialize(model, Target)).toStrictEqual({ partial: { red: 1 }, nullable: null });
        });
    });
});
