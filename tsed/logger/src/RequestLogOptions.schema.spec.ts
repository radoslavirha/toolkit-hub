import { describe, expect, it } from 'vitest';

import { LogLevel } from '@radoslavirha/logger';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';

describe('LoggerOptionsSchema', () => {
    it('defaults all fields when empty object is parsed', () => {
        const result = LoggerOptionsSchema.parse({});
        expect(result).toStrictEqual({
            enabled: true,
            logLevel: LogLevel.INFO,
            requests: {
                enabled: true,
                headers: { enabled: true },
                query: { enabled: true },
                payload: { enabled: true },
                responseBody: { enabled: true },
                stack: true
            }
        });
    });

    it('accepts a valid logLevel', () => {
        const result = LoggerOptionsSchema.parse({ logLevel: LogLevel.DEBUG });
        expect(result.logLevel).toBe(LogLevel.DEBUG);
    });

    it('rejects an unknown logLevel string', () => {
        expect(() => LoggerOptionsSchema.parse({ logLevel: 'VERBOSE' })).toThrow();
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

    it('preserves explicit requests.query.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { query: { enabled: false } } });
        expect(result.requests.query.enabled).toBe(false);
    });

    it('preserves explicit requests.payload.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { payload: { enabled: false } } });
        expect(result.requests.payload.enabled).toBe(false);
    });

    it('preserves explicit requests.responseBody.enabled: false', () => {
        const result = LoggerOptionsSchema.parse({ requests: { responseBody: { enabled: false } } });
        expect(result.requests.responseBody.enabled).toBe(false);
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

    it('produces a type-safe parsed object matching LoggerOptionsParsed inferred type', () => {
        const result = LoggerOptionsSchema.parse({ logLevel: LogLevel.WARN });
        const _check: { enabled: boolean; requests: { enabled: boolean } } = result;
        expect(_check.enabled).toBe(true);
    });
});
