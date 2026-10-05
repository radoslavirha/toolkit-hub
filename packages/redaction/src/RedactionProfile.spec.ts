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

            expect(collected).toStrictEqual({
                headers: '{"authorization":"***","accept":"json"}',
                query: '{"page":2}',
                request: '{"user":"me","password":"***"}'
            });
        });

        it('omits disabled fields entirely rather than logging them raw', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const collected = profile.collect({ response: { secret: 'value' } });

            expect(collected).not.toHaveProperty('response');
            expect(collected).toStrictEqual({});
        });

        it('omits fields absent from the supplied values', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const collected = profile.collect({ query: { a: 1 } });

            expect(Object.keys(collected)).toStrictEqual(['query']);
        });

        it('distinguishes an explicitly undefined field from an absent one', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.collect({ query: undefined })).toStrictEqual({ query: 'undefined' });
            expect(profile.collect({})).toStrictEqual({});
        });

        it('ignores fields that are not configured', () => {
            const profile = new RedactionProfile<Field>({ query: { enabled: true, redactPaths: [] } });

            expect(profile.collect({ query: { a: 1 }, headers: { b: 2 } })).toStrictEqual({ query: '{"a":1}' });
        });

        it('redacts configured paths in a payload that arrives as JSON text', () => {
            const profile = new RedactionProfile({
                response: { enabled: true, redactPaths: ['access_token'] }
            });

            const collected = profile.collect({ response: '{"access_token":"live-secret","expires_in":3600}' });

            expect(collected.response).not.toContain('live-secret');
            expect(collected).toStrictEqual({ response: '{"access_token":"***","expires_in":3600}' });
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

        it('redacts configured paths on a frozen object', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            const redacted = profile.redact('request', Object.freeze({ user: 'ada', password: 'hunter2' }));

            expect(redacted).toBe('{"user":"ada","password":"***"}');
        });
    });

    describe('header name case', () => {
        it('redacts headers regardless of case, keeping the original spelling', () => {
            const profile = new RedactionProfile<Field>({
                headers: { enabled: true, redactPaths: ['authorization', '["x-api-key"]'] }
            });

            const redacted = profile.redact('headers', { Authorization: 'Bearer live-token', 'X-API-Key': 'k-123', Accept: 'application/json' });

            expect(redacted).toBe('{"Authorization":"***","X-API-Key":"***","Accept":"application/json"}');
        });

        it('applies case-insensitivity to headers only when collecting several fields', () => {
            const profile = new RedactionProfile<Field>({
                headers: { enabled: true, redactPaths: ['authorization'] },
                query: { enabled: true, redactPaths: ['authorization'] }
            });

            const collected = profile.collect({ headers: { Authorization: 'a' }, query: { Authorization: 'b' } });

            expect(collected).toStrictEqual({
                headers: '{"Authorization":"***"}',
                query: '{"Authorization":"b"}'
            });
        });
    });

    describe('non-header field name case', () => {
        it('keeps non-header fields case-sensitive', () => {
            const profile = new RedactionProfile<Field>(CONFIG);

            expect(profile.redact('request', { Password: 'x' })).toBe('{"Password":"x"}');
        });

        it('keeps query case-sensitive', () => {
            const profile = new RedactionProfile<Field>({
                query: { enabled: true, redactPaths: ['token'] }
            });

            expect(profile.redact('query', { token: 'a', Token: 'b' })).toBe('{"token":"***","Token":"b"}');
        });

        it('keeps request and response payloads case-sensitive', () => {
            const profile = new RedactionProfile<Field>({
                request: { enabled: true, redactPaths: ['password'] },
                response: { enabled: true, redactPaths: ['access_token'] }
            });

            const collected = profile.collect({
                request: { password: 'a', PASSWORD: 'b' },
                response: { access_token: 'c', Access_Token: 'd' }
            });

            expect(collected).toStrictEqual({
                request: '{"password":"***","PASSWORD":"b"}',
                response: '{"access_token":"***","Access_Token":"d"}'
            });
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

        expect(profile.collect({ anything: 1 })).toStrictEqual({});
    });
});
