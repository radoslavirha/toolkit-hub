import { getJsonSchema, Property } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { ResourceId, ResourceIdPattern } from './ResourceId.js';

class Target {
    @Property()
    @ResourceId(/^[0-9]+$/)
    id!: string;

    @Property()
    @ResourceId('^[a-z]{3}$')
    code!: string;
}

class Preset {
    @Property()
    @ResourceId(ResourceIdPattern.UUID)
    id!: string;
}

describe('ResourceId', () => {
    it('accepts a ResourceIdPattern preset', () => {
        expect(getJsonSchema(Preset).properties.id.pattern).toBe(ResourceIdPattern.UUID);
    });

    it('adds the supplied pattern and a neutral description to the schema', () => {
        const schema = getJsonSchema(Target);

        expect(schema.properties.id).toEqual({
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'Resource identifier'
        });
    });

    it('accepts the pattern as a string', () => {
        expect(getJsonSchema(Target).properties.code.pattern).toBe('^[a-z]{3}$');
    });

    it('rejects a RegExp with flags', () => {
        expect(() => ResourceId(/^abc$/i)).toThrow(/flags/);
    });
});
