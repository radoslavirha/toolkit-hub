import { describe, expect, it } from 'vitest';
import { RedactionFieldOptionsSchema, SENSITIVE_HEADER_SELECTORS, createRedactionSchema } from './RedactionOptions.schema.js';
import { RedactionUtils } from './RedactionUtils.js';

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

    it('applies the per-field default selectors when the field is present without redactPaths', () => {
        // The case that leaks: the field object exists, so an object-level default never
        // fires and `redactPaths` would otherwise fall back to the bare `[]`.
        expect(Schema.parse({ headers: { enabled: true } }).headers)
            .toEqual({ enabled: true, redactPaths: ['authorization'] });
    });

    it('lets configuration replace the default selectors', () => {
        expect(Schema.parse({ headers: { redactPaths: ['x-api-key'] } }).headers)
            .toEqual({ enabled: true, redactPaths: ['x-api-key'] });
    });

    it('replaces rather than appends — the default is absent from a configured list', () => {
        expect(Schema.parse({ headers: { redactPaths: ['x-api-key'] } }).headers.redactPaths)
            .not.toContain('authorization');
    });

    it('honours an explicit empty redactPaths as redact nothing', () => {
        expect(Schema.parse({ headers: { redactPaths: [] } }).headers.redactPaths).toEqual([]);
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

    it('does not share the default array between parses of a partially configured field', () => {
        Schema.parse({ headers: { enabled: true } }).headers.redactPaths.push('mutated');

        expect(Schema.parse({ headers: { enabled: true } }).headers.redactPaths).toEqual(['authorization']);
    });
});

describe('SENSITIVE_HEADER_SELECTORS', () => {
    it('lists the credential-bearing headers in fast-redact selector syntax', () => {
        expect([...SENSITIVE_HEADER_SELECTORS]).toEqual([
            'authorization',
            'cookie',
            '["set-cookie"]',
            '["proxy-authorization"]',
            '["x-api-key"]'
        ]);
    });

    it('compiles to a redactor that censors every listed header and nothing else', () => {
        // Compiling is the real assertion for the bracket form: `fast-redact` throws on a
        // hyphenated name written bare, and a mis-written selector otherwise fails silently.
        const redact = RedactionUtils.compileRedactor([...SENSITIVE_HEADER_SELECTORS]);
        const headers = JSON.parse(redact({
            'authorization': 'Bearer supersecrettokenvalue123',
            'cookie': 'session=abc',
            'set-cookie': 'session=abc; HttpOnly',
            'proxy-authorization': 'Basic dXNlcjpwYXNz',
            'x-api-key': 'k-123',
            'content-type': 'application/json',
            'host': 'localhost:4001'
        })) as Record<string, string>;

        expect(headers).toEqual({
            'authorization': RedactionUtils.REDACTED_VALUE,
            'cookie': RedactionUtils.REDACTED_VALUE,
            'set-cookie': RedactionUtils.REDACTED_VALUE,
            'proxy-authorization': RedactionUtils.REDACTED_VALUE,
            'x-api-key': RedactionUtils.REDACTED_VALUE,
            'content-type': 'application/json',
            'host': 'localhost:4001'
        });
    });
});
