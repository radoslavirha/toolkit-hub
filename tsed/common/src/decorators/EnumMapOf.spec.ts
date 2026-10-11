import { getJsonSchema, Property, Required, SpecTypes } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { EnumMapModel, EnumMapOf } from './EnumMapOf.js';

enum Color {
    Red = 'red',
    Blue = 'blue'
}

enum Level {
    Low,
    High
}

enum Access {
    Read = 'read',
    ValueRange = 'value-range'
}

class Child {
    @Required()
    @Property(String)
    name!: string;
}

class Target {
    @Required()
    @EnumMapOf(Color, Number, { name: 'ColorCountsFull' })
    full!: Record<Color, number>;

    @EnumMapOf(Color, Number, { name: 'ColorCountsPartial', partial: true })
    partial?: Partial<Record<Color, number>>;

    @EnumMapOf(Color, Number, { name: 'ColorCountsNullable', partial: true, nullable: true, nullableValues: true })
    nullable?: Partial<Record<Color, number | null>> | null;

    @EnumMapOf(Color, Child, { name: 'ColorChildren', partial: true })
    children?: Partial<Record<Color, Child>>;

    @EnumMapOf(Color, Child, { name: 'ColorChildrenNullable', partial: true, nullableValues: true })
    nullableChildren?: Partial<Record<Color, Child | null>>;

    @EnumMapOf(Color, Date, { name: 'ColorDates', partial: true })
    dates?: Partial<Record<Color, Date>>;
}

describe('EnumMapOf', () => {
    describe('schema', () => {
        it('generates a named model with one property per enum value, all required by default', () => {
            const schema = getJsonSchema(Target);

            expect(schema.required).toStrictEqual(['full']);
            expect(schema.properties.full).toStrictEqual({ $ref: '#/definitions/ColorCountsFull' });
            expect(schema.definitions.ColorCountsFull).toStrictEqual({
                type: 'object',
                properties: { red: { type: 'number' }, blue: { type: 'number' } },
                required: ['red', 'blue'],
                additionalProperties: false
            });
        });

        it('lists every key in OpenAPI 3.0 so Swagger shows them', () => {
            const spec = getJsonSchema(EnumMapModel(Color, Number, { name: 'ColorCountsFull' }), { specType: SpecTypes.OPENAPI });

            expect(Object.keys(spec.properties)).toStrictEqual(['red', 'blue']);
            expect(spec.required).toStrictEqual(['red', 'blue']);
        });

        it('omits required keys for a partial map', () => {
            expect(getJsonSchema(Target).definitions.ColorCountsPartial.required).toBeUndefined();
        });

        it.each([
            ['a numeric enum', Level, /0, 1/],
            ['hyphenated enum values', Access, /value-range/]
        ])('throws for %s, whose keys @tsed/json-mapper cannot map', (_label, enumType, keys) => {
            expect(() => EnumMapModel(enumType, Number, { name: `Unmappable${String(keys)}` })).toThrow(keys);
        });

        it('emits OAS 3.0 nullable on the map and on scalar and model values', () => {
            const spec = getJsonSchema(Target, { specType: SpecTypes.OPENAPI });
            const nullableValues = getJsonSchema(EnumMapModel(Color, Number, { name: 'ColorCountsNullable', partial: true, nullableValues: true }), { specType: SpecTypes.OPENAPI });
            const nullableChildren = getJsonSchema(EnumMapModel(Color, Child, { name: 'ColorChildrenNullable', partial: true, nullableValues: true }), { specType: SpecTypes.OPENAPI });

            expect(spec.properties.nullable).toStrictEqual({ allOf: [{ $ref: '#/components/schemas/ColorCountsNullable' }], nullable: true });
            expect(nullableValues.properties.red).toStrictEqual({ type: 'number', nullable: true });
            expect(nullableChildren.properties.red).toStrictEqual({ allOf: [{ $ref: '#/components/schemas/Child' }], nullable: true });
        });

        it('emits date-time for Date values', () => {
            expect(getJsonSchema(Target).definitions.ColorDates.properties.red).toStrictEqual({ type: 'string', format: 'date-time' });
        });
    });

    describe('generated model', () => {
        it('returns the same class for the same name and configuration', () => {
            expect(EnumMapModel(Color, Number, { name: 'ColorCountsFull' })).toBe(EnumMapModel(Color, Number, { name: 'ColorCountsFull' }));
        });

        enum Shade {
            Light = 'LIGHT',
            Dark = 'DARK'
        }

        it.each([
            ['another value type', Color, String, { name: 'ColorCountsFull' }],
            ['other options', Color, Number, { name: 'ColorCountsFull', partial: true }],
            ['another enum', Shade, Number, { name: 'ColorCountsFull' }]
        ] as const)('throws when the name is reused with %s', (_label, enumType, type, options) => {
            expect(() => EnumMapModel(enumType, type, options)).toThrow(/already used/);
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
            expect(() => JSONSchemaValidator.validate(Target, { full, nullableChildren: { red: null, blue: { name: 'n' } } })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { full, dates: { red: '2026-01-01T00:00:00.000Z' } })).not.toThrow();
        });

        it.each([
            ['missing keys by default', { full: { red: 1 } }],
            ['an empty map by default', { full: {} }],
            ['an unknown enum key', { full: { ...full, green: 1 } }],
            ['an unknown enum key in a partial map', { full, partial: { green: 1 } }],
            ['a wrong value type', { full: { red: 'x', blue: 2 } }],
            ['null values without nullableValues', { full: { red: null, blue: 2 } }],
            ['null model values without nullableValues', { full, children: { red: null } }],
            ['an invalid model value', { full, children: { red: {} } }],
            ['an invalid date value', { full, dates: { red: 'nope' } }],
            ['null on a non-nullable map', { full: null }],
            ['a missing required map', {}],
            ['an array instead of a map', { full: [1, 2] }]
        ])('rejects %s', (_label, input) => {
            expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
        });
    });

    describe('serialization', () => {
        it('deserializes to the generated model with class instance and Date values', () => {
            const result = JSONSchemaValidator.validate(Target, {
                full: { red: 1, blue: 2 },
                children: { blue: { name: 'n' } },
                nullableChildren: { red: null },
                dates: { red: '2026-01-01T00:00:00.000Z' }
            });

            expect(result.full).toBeInstanceOf(EnumMapModel(Color, Number, { name: 'ColorCountsFull' }));
            expect(result.full).toMatchObject({ red: 1, blue: 2 });
            expect(result.children?.blue).toBeInstanceOf(Child);
            expect(result.nullableChildren?.red).toBeNull();
            expect(result.dates?.red).toStrictEqual(new Date('2026-01-01T00:00:00.000Z'));
        });

        it('serializes null and omits undefined', () => {
            const model = Object.assign(new Target(), { full: { red: 1, blue: undefined }, nullable: null });

            expect(Serializer.serialize(model, Target)).toStrictEqual({ full: { red: 1 }, nullable: null });
        });
    });
});
