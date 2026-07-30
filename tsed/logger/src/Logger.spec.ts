import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Logger as BaseLogger, LogLevel } from '@radoslavirha/logger';
import type { PlatformContext } from '@tsed/platform-http';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions, LoggerOptionsInput, LoggerRequestFieldOptions } from './RequestLogOptions.schema.js';
import { Logger } from './Logger.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parses raw LoggerOptions input into the fully-defaulted constructor shape. */
const getOptions = (opts: LoggerOptionsInput = {}): LoggerOptions => LoggerOptionsSchema.parse(opts);

const compileRedactor = (redactPaths: LoggerRequestFieldOptions['redactPaths']): ((value: unknown) => string) => {
    const compile = (Logger as unknown as {
        compileRedactor: (paths: LoggerRequestFieldOptions['redactPaths']) => ((value: unknown) => string);
    }).compileRedactor;

    return compile(redactPaths);
};

const prepareSourceValue = (value: unknown, sourceOptions: LoggerRequestFieldOptions): string => {
    const prepare = (Logger as unknown as {
        prepareSourceValue: (input: unknown, redactor: ((value: unknown) => string)) => string;
    }).prepareSourceValue;

    return prepare(value, compileRedactor(sourceOptions.redactPaths));
};

/**
 * tsed-logger wraps @radoslavirha/logger for Ts.ED DI injection.
 *
 * Core log-output behaviour is already tested exhaustively in @radoslavirha/logger.
 * Here we only verify the DI-specific concerns:
 *   - Logger is a subclass of BaseLogger
 *   - Logger consumes parsed LoggerOptions
 *   - child() returns a Logger instance (not just BaseLogger)
 *   - The @OverrideProvider(Logger) pattern is the intended API-side setup
 */
const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

describe('Logger (tsed-logger)', () => {
    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('is an instance of BaseLogger', () => {
        const logger = new Logger(getOptions({ level: LogLevel.INFO }));
        expect(logger).toBeInstanceOf(BaseLogger);
    });

    it('is an instance of Logger (tsed subclass)', () => {
        const logger = new Logger(getOptions({ level: LogLevel.INFO }));
        expect(logger).toBeInstanceOf(Logger);
    });

    it('child() returns a BaseLogger instance', () => {
        const logger = new Logger(getOptions({ level: LogLevel.INFO }));
        const child = logger.child('UserService');
        expect(child).toBeInstanceOf(BaseLogger);
    });

    it('accepts level option without throwing', () => {
        expect(() => {
            new Logger(getOptions({ level: LogLevel.DEBUG }));
        }).not.toThrow();
    });

    it('all log-level methods are callable without throwing', () => {
        const logger = new Logger(getOptions({ level: LogLevel.TRACE }));
        expect(() => {
            logger.fatal('m');
            logger.error('m');
            logger.warn('m');
            logger.info('m');
            logger.debug('m');
            logger.trace('m');
        }).not.toThrow();
    });

    it('log methods accept optional attributes without throwing', () => {
        const logger = new Logger(getOptions({ level: LogLevel.INFO }));
        expect(() => {
            logger.info('with attrs', { userId: 'abc', nested: { x: 1 } });
        }).not.toThrow();
    });

    it('logs response body when content-type header is missing', () => {
        const logger = new Logger(getOptions({
            requests: {
                enabled: true,
                response: { enabled: true }
            }
        }));
        const loggerInternal = logger as unknown as {
            $onResponse: ($ctx: PlatformContext) => void;
            httpLog: { info: (message: string, attributes: Record<string, unknown>) => void };
        };

        const infoSpy = vi.spyOn(loggerInternal.httpLog, 'info');
        const ctx = {
            id: 'req-1',
            dateStart: new Date(Date.now() - 10),
            request: {
                method: 'GET',
                url: '/health',
                headers: {},
                query: {},
                body: undefined
            },
            response: {
                statusCode: 200,
                getHeaders: () => ({})
            },
            data: {
                ok: true
            }
        } as unknown as PlatformContext;

        loggerInternal.$onResponse(ctx);

        expect(infoSpy).toHaveBeenCalledTimes(1);
        const args = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
        expect(args[0]).toBe('Request completed');
        expect(args[1]['response']).toBe('{"ok":true}');
    });

    it('stringifyForLog returns original string values unchanged', () => {
        const stringify = (Logger as unknown as { stringifyForLog: (value: unknown) => string }).stringifyForLog;

        expect(stringify('plain-string')).toBe('plain-string');
    });

    it('stringifyForLog returns [[ UNSERIALIZABLE ]] for circular objects', () => {
        const stringify = (Logger as unknown as { stringifyForLog: (value: unknown) => string }).stringifyForLog;
        const circular: Record<string, unknown> = {};
        circular['self'] = circular;

        expect(stringify(circular)).toBe('[[ UNSERIALIZABLE ]]');
    });

    it('stringifyForLog falls back to String(value) when JSON serialization returns undefined', () => {
        const stringify = (Logger as unknown as { stringifyForLog: (value: unknown) => string }).stringifyForLog;
        const value = Symbol('secret');

        expect(stringify(value)).toBe(String(value));
    });

    it('prepareSourceValue redacts explicit nested paths and wildcard paths', () => {
        const source = {
            user: {
                id: 'u-1',
                profile: {
                    password: 'secret'
                }
            },
            items: [
                { token: 'a' },
                { token: 'b' }
            ]
        };

        const serialized = prepareSourceValue(source, {
            enabled: true,
            redactPaths: ['user.profile.password', 'items.*.token']
        });

        const parsed = JSON.parse(serialized) as Record<string, unknown>;
        const parsedUser = parsed['user'] as Record<string, unknown>;
        const parsedProfile = parsedUser['profile'] as Record<string, unknown>;
        const parsedItems = parsed['items'] as Array<Record<string, unknown>>;

        expect(parsedProfile['password']).toBe('***');
        expect(parsedItems[0]['token']).toBe('***');
        expect(parsedItems[1]['token']).toBe('***');
    });

    it('prepareSourceValue redacts root-level keys only for single-segment selectors', () => {
        const source = {
            token: 'root',
            nested: {
                token: 'nested'
            }
        };

        const serialized = prepareSourceValue(source, {
            enabled: true,
            redactPaths: ['token']
        });

        expect(serialized).toBe('{"token":"***","nested":{"token":"nested"}}');
    });

    it('prepareSourceValue supports wildcard paths that redact whole array elements', () => {
        const serialized = prepareSourceValue({
            items: [
                { token: 'a' },
                { token: 'b' }
            ]
        }, {
            enabled: true,
            redactPaths: ['items.*']
        });

        expect(serialized).toBe('{"items":["***","***"]}');
    });

    it('compileRedactor returns serializer function for empty selector list', () => {
        const compiled = compileRedactor([]);

        expect(compiled({ value: 1 })).toBe('{"value":1}');
        expect(compiled('text')).toBe('text');
    });

    it('compileRedactor rejects malformed selectors', () => {
        expect(() => {
            compileRedactor(['user..id']);
        }).toThrow();
    });

    it('prepareSourceValue reuses wildcard selector branches for multiple wildcard paths', () => {
        const serialized = prepareSourceValue({
            items: [
                { token: 'a', secret: 'x' },
                { token: 'b', secret: 'y' }
            ]
        }, {
            enabled: true,
            redactPaths: ['items.*.token', 'items.*.secret']
        });

        expect(serialized).toBe('{"items":[{"token":"***","secret":"***"},{"token":"***","secret":"***"}]}');
    });

    it('prepareSourceValue keeps unmatched array elements and primitive tails unchanged', () => {
        const serialized = prepareSourceValue({
            items: [
                { id: '1' },
                { id: '2' }
            ],
            value: 5
        }, {
            enabled: true,
            redactPaths: ['items[0].id', 'value.id']
        });

        expect(serialized).toBe('{"items":[{"id":"***"},{"id":"2"}],"value":5}');
    });

    it('prepareSourceValue handles circular and shared references during redaction', () => {
        const shared: Record<string, unknown> = {
            id: 'shared'
        };
        const sourceWithShared = {
            list: [shared, shared]
        };

        const redactedShared = prepareSourceValue(sourceWithShared, {
            enabled: true,
            redactPaths: ['list.*.id']
        });
        expect(redactedShared).toBe('{"list":[{"id":"***"},{"id":"***"}]}');

        const cyclic: unknown[] = [];
        cyclic.push(cyclic);
        const cyclicSerialized = prepareSourceValue({
            payload: cyclic
        }, {
            enabled: true,
            redactPaths: ['list.*.id']
        });

        expect(cyclicSerialized).toBe('[[ UNSERIALIZABLE ]]');
    });

    it('prepareSourceValue handles recursive array and object references while traversing matching paths', () => {
        const cyclicArray: unknown[] = [];
        cyclicArray.push(cyclicArray);

        const cyclicObject: Record<string, unknown> = {};
        cyclicObject['self'] = cyclicObject;

        const serialized = prepareSourceValue({
            payload: cyclicArray,
            node: cyclicObject
        }, {
            enabled: true,
            redactPaths: ['payload[0].id', 'node.self.id']
        });

        expect(serialized).toBe('[[ UNSERIALIZABLE ]]');
    });

});

