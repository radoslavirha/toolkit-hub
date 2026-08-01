import { describe, expect, it } from 'vitest';
import { RedactionFieldOptionsSchema, createRedactionSchema } from './RedactionOptions.schema.js';

describe('RedactionFieldOptionsSchema', () => {
    it('defaults to enabled with no selectors', () => {
        expect(RedactionFieldOptionsSchema.parse({})).toEqual({ enabled: true, redactPaths: [] });
    });

    it('keeps explicit values', () => {
        expect(RedactionFieldOptionsSchema.parse({ enabled: false, redactPaths: ['a.b'] }))
            .toEqual({ enabled: false, redactPaths: ['a.b'] });
    });

    it('trims selectors and rejects empty ones', () => {
        expect(RedactionFieldOptionsSchema.parse({ redactPaths: ['  token  '] }).redactPaths).toEqual(['token']);
        expect(() => RedactionFieldOptionsSchema.parse({ redactPaths: ['   '] })).toThrow();
    });
});

describe('createRedactionSchema', () => {
    const Schema = createRedactionSchema({
        headers: ['authorization'],
        response: []
    });

    it('applies the per-field default selectors when the field is omitted', () => {
        expect(Schema.parse({})).toEqual({
            headers: { enabled: true, redactPaths: ['authorization'] },
            response: { enabled: true, redactPaths: [] }
        });
    });

    it('lets configuration replace the default selectors', () => {
        expect(Schema.parse({ headers: { redactPaths: ['x-api-key'] } }).headers)
            .toEqual({ enabled: true, redactPaths: ['x-api-key'] });
    });

    it('lets configuration disable a field', () => {
        expect(Schema.parse({ response: { enabled: false } }).response)
            .toEqual({ enabled: false, redactPaths: [] });
    });

    it('does not share the default array between parses', () => {
        const first = Schema.parse({});
        first.headers.redactPaths.push('mutated');

        expect(Schema.parse({}).headers.redactPaths).toEqual(['authorization']);
    });
});
