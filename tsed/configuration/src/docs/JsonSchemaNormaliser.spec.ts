import { describe, expect, it } from 'vitest';
import type { JsonSchemaNode } from './JsonSchemaNode.js';
import { JsonSchemaNormaliser } from './JsonSchemaNormaliser.js';

// Hand-written schemas: Zod already merges the simple cases (object & object, string | null)
// before they reach the normaliser, so these shapes only appear from deeper combinations.
describe('JsonSchemaNormaliser', () => {
    it('merges allOf members that share a property', () => {
        const result = JsonSchemaNormaliser.normalise({
            allOf: [
                { type: 'object', properties: { a: { type: 'object', properties: { x: { type: 'string' } } } }, required: ['a'] },
                { type: 'object', properties: { a: { type: 'object', properties: { y: { type: 'number' } } } } }
            ]
        });

        expect(result?.required).toEqual(['a']);
        expect(Object.keys(result?.properties?.a.properties ?? {})).toEqual(['x', 'y']);
    });

    it('returns null when allOf members share a property with contradicting consts', () => {
        const result = JsonSchemaNormaliser.normalise({
            allOf: [
                { type: 'object', properties: { enabled: { const: true } } },
                { type: 'object', properties: { enabled: { const: false } } }
            ]
        });

        expect(result).toBeNull();
    });

    it('collapses a union left with one possible variant', () => {
        const result = JsonSchemaNormaliser.normalise({
            description: 'Kept.',
            anyOf: [
                { type: 'object', properties: { on: { const: true } } },
                { type: 'object', properties: { on: { allOf: [{ const: true }, { const: false }] } } }
            ]
        });

        expect(result).toEqual({ type: 'object', description: 'Kept.', properties: { on: { const: true } } });
    });

    it('splits null off a union of several objects', () => {
        const variants: JsonSchemaNode[] = [
            { type: 'object', properties: { a: { type: 'string' } } },
            { type: 'object', properties: { b: { type: 'string' } } },
            { type: 'null' }
        ];

        const result = JsonSchemaNormaliser.splitNullable({ anyOf: variants });

        expect(result).toEqual({ schema: { anyOf: variants.slice(0, 2) }, nullable: true });
    });

    it('leaves a schema without a union untouched', () => {
        const schema: JsonSchemaNode = { type: 'string' };

        expect(JsonSchemaNormaliser.splitNullable(schema)).toEqual({ schema, nullable: false });
    });
});
