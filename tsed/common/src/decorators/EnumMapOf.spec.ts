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
    full!: Map<Color, number>;

    @EnumMapOf(Color, Number, { partial: true })
    partial?: Map<Color, number>;

    @EnumMapOf(Color, Number, { partial: true, nullable: true, nullableValues: true })
    nullable?: Map<Color, number | null> | null;

    @EnumMapOf(Color, Child, { partial: true })
    children?: Map<Color, Child>;

    @EnumMapOf(Level, String, { partial: true })
    levels?: Map<Level, string>;
}

describe('EnumMapOf', () => {
    describe('schema', () => {
        it('restricts propertyNames to the enum values', () => {
            const schema = getJsonSchema(Target);

            expect(schema.required).toStrictEqual(['full']);
            expect(schema.properties.full).toStrictEqual({
                type: 'object',
                additionalProperties: { type: 'number' },
                propertyNames: { enum: ['red', 'blue'], type: 'string' },
                minProperties: 2
            });
        });

        it('omits minProperties for a partial map', () => {
            expect(getJsonSchema(Target).properties.partial.minProperties).toBeUndefined();
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
        const full = { red: 1, blue: 2 };

        it('accepts a full map, and a subset, an empty map or null where partial / nullable', () => {
            expect(() => JSONSchemaValidator.validate(Target, { full })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, partial: {} })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, partial: { red: 1 } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, nullable: null })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, nullable: { red: null } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, levels: { 0: 'a' } })).not.toThrow();
        });

        it.each([
            ['missing keys by default', { full: { red: 1 } }],
            ['an empty map by default', { full: {} }],
            ['an unknown enum key', { full: { ...full, green: 1 } }],
            ['an unknown enum key in a partial map', { full, partial: { green: 1 } }],
            ['a wrong value type', { full: { red: 'x', blue: 2 } }],
            ['null values without nullableValues', { full: { red: null, blue: 2 } }],
            ['null on a non-nullable map', { full: null }],
            ['a missing required map', {}],
            ['a dotted key', { full, partial: { 'a.b': 1 } }]
        ])('rejects %s', (_label, input) => {
            expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
        });
    });

    describe('serialization', () => {
        it('deserializes to a Map with class instance values', () => {
            const result = JSONSchemaValidator.validate(Target, { full: { red: 1, blue: 2 }, children: { blue: { name: 'n' } } });

            expect(result.full).toStrictEqual(new Map([[Color.Red, 1], [Color.Blue, 2]]));
            expect(result.children?.get(Color.Blue)).toBeInstanceOf(Child);
        });

        it('serializes null and omits undefined', () => {
            const model = Object.assign(new Target(), { full: new Map([[Color.Red, 1]]), nullable: null });

            expect(Serializer.serialize(model, Target)).toStrictEqual({ full: { red: 1 }, nullable: null });
        });
    });
});
