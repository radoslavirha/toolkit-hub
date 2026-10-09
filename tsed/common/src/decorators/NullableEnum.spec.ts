import { Enum, getJsonSchema, Nullable, Required } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { NullableEnum } from './NullableEnum.js';

enum Color {
    RED = 'red',
    BLUE = 'blue'
}

enum Level {
    LOW = 1,
    HIGH = 2
}

class Target {
    @NullableEnum(Color)
    color?: Color | null;

    @NullableEnum(Level)
    level?: Level | null;
}

class RequiredTarget {
    @Required()
    @NullableEnum(Color)
    color!: Color | null;
}

describe('NullableEnum', () => {
    it('adds null to the enum values', () => {
        const schema = getJsonSchema(Target);

        expect(schema.properties.color.enum).toStrictEqual(['red', 'blue', null]);
        expect(schema.properties.level.enum).toStrictEqual([1, 2, null]);
    });

    it('emits nullable in OpenAPI 3', () => {
        const schema = getJsonSchema(Target, { specType: 'openapi3' as never }) as { properties?: Record<string, unknown> };

        expect(schema.properties?.color).toEqual(expect.objectContaining({ nullable: true }));
    });

    it.each([
        ['a member', { color: 'red', level: 2 }],
        ['null', { color: null, level: null }],
        ['missing', {}]
    ])('accepts %s', (_name, input) => {
        expect(() => JSONSchemaValidator.validate(Target, input)).not.toThrow();
    });

    it.each([
        ['an unknown string', { color: 'green' }],
        ['a wrong type', { color: 1 }],
        ['an unknown number', { level: 3 }],
        ['a string for a numeric enum', { level: 'LOW' }]
    ])('rejects %s', (_name, input) => {
        expect.assertions(1);
        try {
            JSONSchemaValidator.validate(Target, input);
        } catch (errors) {
            expect(Array.isArray(errors)).toBe(true);
        }
    });

    it('requires the property but allows null when combined with Required', () => {
        expect(() => JSONSchemaValidator.validate(RequiredTarget, { color: null })).not.toThrow();
        expect.assertions(2);
        try {
            JSONSchemaValidator.validate(RequiredTarget, {});
        } catch (errors) {
            expect(Array.isArray(errors)).toBe(true);
        }
    });

    describe('traps in native decorators', () => {
        // If one of these starts failing after a @tsed/* bump, Ts.ED changed: revisit the helper.
        it('leaves null out of enum for Nullable(String) + Enum', () => {
            class Native {
                @Nullable(String)
                @Enum(Color)
                color?: Color | null;
            }

            expect(getJsonSchema(Native).properties.color.enum).toStrictEqual(['red', 'blue']);
        });
    });
});
