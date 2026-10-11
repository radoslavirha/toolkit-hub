import type { Type } from '@tsed/core';
import { getJsonSchema, Property, Required } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { NullableOf } from './NullableOf.js';

class Child {
    @Property()
    name!: string;
}

class Target {
    @NullableOf(Child)
    child?: Child | null;
}

class RequiredTarget {
    @Required()
    @NullableOf(Child)
    child!: Child | null;
}

const oas = (model: Type<unknown>) => getJsonSchema(model, { specType: 'openapi3' as never }) as { properties: Record<string, unknown>; required?: string[] };

describe('NullableOf', () => {
    it('emits null or a $ref in JSON Schema', () => {
        expect(getJsonSchema(Target).properties.child).toStrictEqual({
            oneOf: [{ type: 'null' }, { $ref: '#/definitions/Child' }]
        });
    });

    it('emits allOf with nullable in OpenAPI 3.0', () => {
        expect(oas(Target).properties.child).toStrictEqual({
            allOf: [{ $ref: '#/components/schemas/Child' }],
            nullable: true
        });
    });

    it('requires the property when marked required', () => {
        expect(oas(RequiredTarget).required).toStrictEqual(['child']);
    });

    it.each([
        ['null', { child: null }],
        ['a valid child', { child: { name: 'x' } }],
        ['missing', {}]
    ])('accepts %s', (_name, input) => {
        expect(() => JSONSchemaValidator.validate(Target, input)).not.toThrow();
    });

    it.each([
        ['an invalid nested value', { child: { name: 1 } }],
        ['a wrong type', { child: 5 }]
    ])('rejects %s', (_name, input) => {
        expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
    });

    it('rejects null for a required property that is missing', () => {
        expect(() => JSONSchemaValidator.validate(RequiredTarget, {})).toThrow();
    });

    it('deserializes to a Child instance', () => {
        const result = Serializer.deserialize({ child: { name: 'x' } }, Target);

        expect(result.child).toBeInstanceOf(Child);
        expect(Serializer.deserialize({ child: null }, Target).child).toBeNull();
    });
});
