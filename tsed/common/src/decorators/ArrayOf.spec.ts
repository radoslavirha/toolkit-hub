import { getJsonSchema, Property, Required, SpecTypes } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { Serializer } from '../serializer/Serializer.js';
import { JSONSchemaValidator } from '../validators/JSONSchemaValidator.js';
import { ArrayOf } from './ArrayOf.js';

class Child {
    @Property()
    name!: string;
}

class Target {
    @Required()
    @ArrayOf(Child)
    required!: Child[];

    @ArrayOf(Child)
    optional?: Child[];

    @ArrayOf(Child, { nullable: true })
    nullable?: Child[] | null;

    @ArrayOf(Number, { nullable: true })
    numbers?: number[] | null;
}

describe('ArrayOf', () => {
    describe('schema', () => {
        it('emits a plain array for a required array', () => {
            const schema = getJsonSchema(Target);

            expect(schema.required).toStrictEqual(['required']);
            expect(schema.properties.required).toStrictEqual({ type: 'array', items: { $ref: '#/definitions/Child' } });
            expect(schema.properties.optional).toStrictEqual({ type: 'array', items: { $ref: '#/definitions/Child' } });
        });

        it('emits type null for a nullable array in JSON Schema', () => {
            expect(getJsonSchema(Target).properties.nullable.type).toStrictEqual(['null', 'array']);
        });

        it('emits nullable: true for a nullable array in OAS 3.0', () => {
            const schema = getJsonSchema(Target, { specType: SpecTypes.OPENAPI });

            expect(schema.properties.nullable).toStrictEqual({
                type: 'array',
                items: { $ref: '#/components/schemas/Child' },
                nullable: true
            });
            expect(schema.properties.required.nullable).toBeUndefined();
        });
    });

    describe('validation', () => {
        it('accepts valid, empty and (when nullable) null arrays', () => {
            expect(() => JSONSchemaValidator.validate(Target, { required: [] })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { required: [{ name: 'a' }], nullable: [], numbers: [1] })).not.toThrow();
            expect(() => JSONSchemaValidator.validate(Target, { required: [], nullable: null, numbers: null })).not.toThrow();
        });

        it('rejects a missing required array', () => {
            expect.assertions(1);
            try {
                JSONSchemaValidator.validate(Target, {});
            } catch (errors) {
                expect(errors).toStrictEqual([expect.objectContaining({ keyword: 'required' })]);
            }
        });

        it.each([
            ['null on a non-nullable array', { required: [], optional: null }],
            ['an object instead of an array', { required: {} }],
            ['an object for a nullable array', { required: [], nullable: {} }],
            ['an item of the wrong type', { required: ['x'] }],
            ['a number item of the wrong type', { required: [], numbers: ['1'] }]
        ])('rejects %s', (_label, input) => {
            expect(() => JSONSchemaValidator.validate(Target, input)).toThrow();
        });
    });

    describe('serialization', () => {
        it('deserializes items to class instances', () => {
            const result = JSONSchemaValidator.validate(Target, { required: [{ name: 'a' }], nullable: [{ name: 'b' }] });

            expect(result.required).toStrictEqual([Object.assign(new Child(), { name: 'a' })]);
            expect(result.nullable?.[0]).toBeInstanceOf(Child);
        });

        it('emits null and omits undefined', () => {
            const model = Object.assign(new Target(), { required: [], nullable: null });

            expect(Serializer.serialize(model, Target)).toStrictEqual({ required: [], nullable: null });
        });
    });
});
