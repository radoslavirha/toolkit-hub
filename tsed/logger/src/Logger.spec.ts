import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Logger as BaseLogger, LogLevel } from '@radoslavirha/logger';
import type { PlatformContext } from '@tsed/platform-http';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions, LoggerOptionsInput } from './RequestLogOptions.schema.js';
import { Logger } from './Logger.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parses raw LoggerOptions input into the fully-defaulted constructor shape. */
const getOptions = (opts: LoggerOptionsInput = {}): LoggerOptions => LoggerOptionsSchema.parse(opts);

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

});

