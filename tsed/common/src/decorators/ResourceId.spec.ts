import { getJsonSchema, Property } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { isValidResourceId, ResourceId } from './ResourceId.js';

class Target {
    @Property()
    @ResourceId()
    id!: string;
}

describe('ResourceId', () => {
    it('adds a neutral pattern and description to the schema', () => {
        const schema = getJsonSchema(Target);

        expect(schema.properties.id).toEqual({
            type: 'string',
            pattern: '^[a-fA-F0-9]{24}$',
            description: 'Resource identifier'
        });
    });

    it('does not mention the storage engine in the schema', () => {
        expect(JSON.stringify(getJsonSchema(Target)).toLowerCase()).not.toMatch(/mongo|objectid/);
    });
});

describe('isValidResourceId', () => {
    it('accepts a 24-character hex string', () => {
        expect(isValidResourceId('507f1f77bcf86cd799439011')).toBe(true);
        expect(isValidResourceId('507F1F77BCF86CD799439011')).toBe(true);
    });

    it.each(['', 'abc', '507f1f77bcf86cd79943901', '507f1f77bcf86cd7994390111', 'zzzf1f77bcf86cd799439011', 123, null, undefined])(
        'rejects %s',
        (value) => {
            expect(isValidResourceId(value)).toBe(false);
        }
    );
});
