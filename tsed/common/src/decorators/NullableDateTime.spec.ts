import { getJsonSchema, Nullable, Property } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { NullableDateTime } from './NullableDateTime.js';

class Target {
    @NullableDateTime()
    at?: Date | null;
}

class NativeTarget {
    @Nullable(Date)
    at?: Date | null;
}

class PlainDate {
    @Property(Date)
    at?: Date;
}

describe('NullableDateTime', () => {
    it('emits a date-time format that allows null', () => {
        const schema = getJsonSchema(Target);

        expect(schema.properties.at.format).toBe('date-time');
        expect(schema.properties.at.type).toStrictEqual(['null', 'string']);
    });

    it('emits nullable in OpenAPI 3', () => {
        const schema = getJsonSchema(Target, { specType: 'openapi3' as never }) as { properties?: Record<string, unknown> };

        expect(schema.properties?.at).toEqual(expect.objectContaining({ format: 'date-time', nullable: true }));
    });

    it.each([
        ['a date-time', { at: '2024-01-02T03:04:05.000Z' }],
        ['null', { at: null }],
        ['missing', {}]
    ])('accepts %s', (_name, input) => {
        expect(() => JSONSchemaValidator.validate(Target, input)).not.toThrow();
    });

    it.each([
        ['an invalid string', { at: 'nope' }],
        ['a number', { at: 5 }]
    ])('rejects %s', (_name, input) => {
        expect.assertions(1);
        try {
            JSONSchemaValidator.validate(Target, input);
        } catch (errors) {
            expect(Array.isArray(errors)).toBe(true);
        }
    });

    it('deserializes to a Date and keeps null', () => {
        expect(JSONSchemaValidator.validate(Target, { at: '2024-01-02T03:04:05.000Z' }).at).toStrictEqual(new Date('2024-01-02T03:04:05.000Z'));
        expect(JSONSchemaValidator.validate(Target, { at: null }).at).toBeNull();
    });

    it('serializes null and omits undefined', () => {
        expect(Serializer.serialize({ at: null } as Target, Target)).toStrictEqual({ at: null });
        expect(Serializer.serialize({} as Target, Target)).toStrictEqual({});
    });

    describe('traps in native decorators', () => {
        it('accepts an invalid string for Nullable(Date) without DateTime', () => {
            expect(getJsonSchema(NativeTarget).properties.at.format).toBeUndefined();
            expect(() => JSONSchemaValidator.validate(NativeTarget, { at: 'nope' })).not.toThrow();
        });

        it('accepts an invalid string for Property(Date) without DateTime', () => {
            expect(() => JSONSchemaValidator.validate(PlainDate, { at: 'nope' })).not.toThrow();
        });
    });
});
