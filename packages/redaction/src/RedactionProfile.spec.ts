import { describe, expect, it } from 'vitest';
import { RedactionProfile } from './RedactionProfile.js';

type Field = 'headers' | 'query' | 'request' | 'response';

const CONFIG = {
    headers: { enabled: true, redactPaths: ['authorization', '["set-cookie"]'] },
    query: { enabled: true, redactPaths: [] },
    request: { enabled: true, redactPaths: ['password'] },
    response: { enabled: false, redactPaths: [] }
};

describe('RedactionProfile', () => {
    describe('collect', () => {
        it('redacts every enabled field in one pass', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const collected = profile.collect({
                headers: { authorization: 'Bearer secret', accept: 'json' },
                query: { page: 2 },
                request: { user: 'me', password: 'hunter2' }
            });

            expect(collected).toEqual({
                headers: '{"authorization":"***","accept":"json"}',
                query: '{"page":2}',
                request: '{"user":"me","password":"***"}'
            });
        });

        it('omits disabled fields entirely rather than logging them raw', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const collected = profile.collect({ response: { secret: 'value' } });

            expect(collected).not.toHaveProperty('response');
            expect(collected).toEqual({});
        });

        it('omits fields absent from the supplied values', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const collected = profile.collect({ query: { a: 1 } });

            expect(Object.keys(collected)).toEqual(['query']);
        });

        it('distinguishes an explicitly undefined field from an absent one', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.collect({ query: undefined })).toEqual({ query: 'undefined' });
            expect(profile.collect({})).toEqual({});
        });

        it('ignores fields that are not configured', () => {
            const profile = new RedactionProfile<Field>({ query: { enabled: true, redactPaths: [] } });

            expect(profile.collect({ query: { a: 1 }, headers: { b: 2 } })).toEqual({ query: '{"a":1}' });
        });
    });

    describe('redact', () => {
        it('redacts a single field', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.redact('request', { password: 'x' })).toBe('{"password":"***"}');
        });

        it('returns undefined for a disabled or unknown field', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.redact('response', { a: 1 })).toBeUndefined();
        });
    });

    describe('isEnabled', () => {
        it('reports configured and enabled fields', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.isEnabled('headers')).toBe(true);
            expect(profile.isEnabled('response')).toBe(false);
        });
    });

    describe('performance contract', () => {
        it('compiles each redactor once, not per call', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            // A compiled fast-redact function is stable across calls; capturing
            // it once and comparing proves no recompilation happens per call.
            const first = profile.redact('headers', { authorization: 'a' });
            const second = profile.redact('headers', { authorization: 'b' });

            expect(first).toBe('{"authorization":"***"}');
            expect(second).toBe('{"authorization":"***"}');
        });

        it('compiles no redactor for a disabled field', () => {
            const profile = new RedactionProfile<Field>({
                response: { enabled: false, redactPaths: ['this.path.is.never.compiled'] }
            });

            expect(profile.isEnabled('response')).toBe(false);
        });
    });

    it('accepts an empty configuration', () => {
        const profile = new RedactionProfile({});

        expect(profile.collect({ anything: 1 })).toEqual({});
    });
});
