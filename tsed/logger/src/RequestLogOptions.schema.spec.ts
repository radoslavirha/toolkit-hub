import { describe, expect, it } from 'vitest';

import { LogLevel } from '@radoslavirha/logger';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions } from './RequestLogOptions.schema.js';

describe('LoggerOptionsSchema', () => {
    it('defaults all fields when empty object is parsed', () => {
        const result = LoggerOptionsSchema.parse({});
        expect(result).toStrictEqual({
            enabled: true,
            level: LogLevel.INFO,
            requests: {
                enabled: true,
                headers: { enabled: true, redactPaths: [] },
                query: { enabled: true, redactPaths: [] },
                request: { enabled: true, redactPaths: [] },
                response: { enabled: true, redactPaths: [] },
                stack: true,
                ignorePaths: ['/health', '/healthz']
            }
        });
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
