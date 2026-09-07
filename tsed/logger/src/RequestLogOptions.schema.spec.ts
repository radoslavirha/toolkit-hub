import { describe, expect, it } from 'vitest';

import { LogLevel } from '@radoslavirha/logger';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions } from './RequestLogOptions.schema.js';

/**
 * The header selectors this package must redact when a service configures nothing.
 * Written out literally rather than imported from `@radoslavirha/redaction`: this is the
 * contract consumers were promised, and a test that compares the constant to itself could
 * not notice the list being emptied.
 */
const DEFAULT_HEADER_SELECTORS = [
    'authorization',
    'cookie',
    '["set-cookie"]',
    '["proxy-authorization"]',
    '["x-api-key"]'
];

describe('LoggerOptionsSchema', () => {
    it('defaults all fields when empty object is parsed', () => {
        const result = LoggerOptionsSchema.parse({});
        expect(result).toStrictEqual({
            enabled: true,
            level: LogLevel.INFO,
            requests: {
                enabled: true,
                headers: { enabled: true, redactPaths: DEFAULT_HEADER_SELECTORS },
                query: { enabled: true, redactPaths: [] },
                request: { enabled: true, redactPaths: [] },
                response: { enabled: true, redactPaths: [] },
                stack: true,
                ignorePaths: ['/health', '/healthz']
            }
        });
    });

    describe('requests.headers.redactPaths defaults', () => {
        it('redacts the credential-bearing headers when the requests block is omitted entirely', () => {
            expect(LoggerOptionsSchema.parse({}).requests.headers.redactPaths).toStrictEqual(DEFAULT_HEADER_SELECTORS);
        });

        it('redacts the credential-bearing headers when requests is given without headers', () => {
            const result = LoggerOptionsSchema.parse({ requests: { enabled: true } });
            expect(result.requests.headers.redactPaths).toStrictEqual(DEFAULT_HEADER_SELECTORS);
        });

        it('redacts the credential-bearing headers when headers is given without redactPaths', () => {
            const result = LoggerOptionsSchema.parse({ requests: { headers: { enabled: true } } });
            expect(result.requests.headers.redactPaths).toStrictEqual(DEFAULT_HEADER_SELECTORS);
        });

        it('replaces the default rather than appending to it when redactPaths is configured', () => {
            const result = LoggerOptionsSchema.parse({ requests: { headers: { redactPaths: ['x-custom'] } } });

            expect(result.requests.headers.redactPaths).toStrictEqual(['x-custom']);
            expect(result.requests.headers.redactPaths).not.toContain('authorization');
        });

        it('honours an explicit empty redactPaths as redact nothing', () => {
            const result = LoggerOptionsSchema.parse({ requests: { headers: { redactPaths: [] } } });
            expect(result.requests.headers.redactPaths).toStrictEqual([]);
        });

        it('does not share the default array between parses', () => {
            LoggerOptionsSchema.parse({}).requests.headers.redactPaths.push('mutated');
            expect(LoggerOptionsSchema.parse({}).requests.headers.redactPaths).toStrictEqual(DEFAULT_HEADER_SELECTORS);
        });

        it.each(['query', 'request', 'response'] as const)(
            'leaves requests.%s.redactPaths empty — those field names are application-specific',
            (source) => {
                expect(LoggerOptionsSchema.parse({}).requests[source].redactPaths).toStrictEqual([]);
                expect(LoggerOptionsSchema.parse({ requests: { [source]: { enabled: true } } })[
                    'requests'
                ][source].redactPaths).toStrictEqual([]);
            }
        );
    });

    it('defaults requests.ignorePaths to the Kubernetes probe paths', () => {
        const result = LoggerOptionsSchema.parse({ requests: { enabled: true } });
        expect(result.requests.ignorePaths).toStrictEqual(['/health', '/healthz']);
    });

    it('preserves explicit requests.ignorePaths', () => {
        const result = LoggerOptionsSchema.parse({ requests: { ignorePaths: ['/probe'] } });
        expect(result.requests.ignorePaths).toStrictEqual(['/probe']);
    });

    it('preserves an empty requests.ignorePaths array', () => {
        const result = LoggerOptionsSchema.parse({ requests: { ignorePaths: [] } });
        expect(result.requests.ignorePaths).toStrictEqual([]);
    });

    it('rejects a non-string entry in requests.ignorePaths', () => {
        expect(() => LoggerOptionsSchema.parse({ requests: { ignorePaths: [/health/] } })).toThrow();
    });

    it('accepts a valid level', () => {
        const result = LoggerOptionsSchema.parse({ level: LogLevel.DEBUG });
        expect(result.level).toBe(LogLevel.DEBUG);
    });

    it('rejects an unknown level string', () => {
        expect(() => LoggerOptionsSchema.parse({ level: 'VERBOSE' })).toThrow();
    });

    it('preserves explicit enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ enabled: false });
        expect(result.enabled).toBe(false);
    });

    it('preserves explicit requests.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { enabled: false } });
        expect(result.requests.enabled).toBe(false);
    });

    it('preserves explicit requests.headers.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { headers: { enabled: false } } });
        expect(result.requests.headers.enabled).toBe(false);
    });

    it('preserves explicit requests.headers.redactPaths selectors', () => {
        const result = LoggerOptionsSchema.parse({ requests: { headers: { redactPaths: ['authorization', 'x-api-key'] } } });
        expect(result.requests.headers.redactPaths).toStrictEqual(['authorization', 'x-api-key']);
    });

    it('preserves explicit requests.query.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { query: { enabled: false } } });
        expect(result.requests.query.enabled).toBe(false);
    });

    it('preserves explicit requests.request.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { request: { enabled: false } } });
        expect(result.requests.request.enabled).toBe(false);
    });

    it('preserves explicit requests.response.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { response: { enabled: false } } });
        expect(result.requests.response.enabled).toBe(false);
    });

    it('preserves explicit requests.stack: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { stack: false } });
        expect(result.requests.stack).toBe(false);
    });

    it('rejects a non-object requests value', () => {
        expect(() => LoggerOptionsSchema.parse({ requests: 1 })).toThrow();
    });

    it('rejects a non-boolean requests.enabled value', () => {
        expect(() => LoggerOptionsSchema.parse({ requests: { enabled: 'yes' } })).toThrow();
    });

    it('rejects a non-boolean requests.headers.enabled value', () => {
        expect(() => LoggerOptionsSchema.parse({ requests: { headers: { enabled: 'yes' } } })).toThrow();
    });

    it('rejects non-array requests.headers.redactPaths', () => {
        expect(() => LoggerOptionsSchema.parse({ requests: { headers: { redactPaths: 'authorization' } } })).toThrow();
    });

    it('produces a type-safe parsed object matching LoggerOptions output type', () => {
        const result = LoggerOptionsSchema.parse({ level: LogLevel.WARN });
        const _check: LoggerOptions = result;
        expect(_check.enabled).toBe(true);
    });
});
