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
 *   - The @Injectable({token: Logger, scope: ProviderScope.SINGLETON}) pattern is the intended API-side setup
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
                url: '/api/things',
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

    describe('requests.ignorePaths', () => {
        type LoggerInternal = {
            $onResponse: ($ctx: PlatformContext) => void;
            httpLog: {
                info: (message: string, attributes: Record<string, unknown>) => void;
                error: (message: string, attributes: Record<string, unknown>) => void;
            };
            redaction: { collect: (sources: Record<string, unknown>) => Record<string, unknown> };
        };

        const buildCtx = (url: string, statusCode = 200): PlatformContext => ({
            id: 'req-1',
            dateStart: new Date(Date.now() - 10),
            request: {
                method: 'GET',
                url,
                headers: {},
                query: {},
                body: undefined
            },
            response: {
                statusCode,
                getHeaders: () => ({})
            },
            data: { ok: true }
        } as unknown as PlatformContext);

        const buildLogger = (ignorePaths?: string[]): LoggerInternal => {
            const logger = new Logger(getOptions({
                requests: {
                    enabled: true,
                    ...(ignorePaths ? { ignorePaths } : {})
                }
            }));

            return logger as unknown as LoggerInternal;
        };

        it('suppresses a path under a default ignore entry', () => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/health/live'));

            expect(infoSpy).not.toHaveBeenCalled();
        });

        it('still logs a path outside the ignore list', () => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/api/things'));

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('strips the query string before matching', () => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/health/ready?verbose=1'));

            expect(infoSpy).not.toHaveBeenCalled();
        });

        it('matches only on a path-segment boundary', () => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/healthchecks-admin'));

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('is case-sensitive', () => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/Health/live'));

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('logs every path when ignorePaths is empty', () => {
            const logger = buildLogger([]);
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            logger.$onResponse(buildCtx('/health/live'));

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('does no redaction work for a suppressed request', () => {
            const logger = buildLogger();
            const collectSpy = vi.spyOn(logger.redaction, 'collect');

            logger.$onResponse(buildCtx('/health/live'));

            expect(collectSpy).not.toHaveBeenCalled();
        });

        it('suppresses a failed request on an ignored path — the filter is about the path, not the outcome', () => {
            const logger = buildLogger();
            const errorSpy = vi.spyOn(logger.httpLog, 'error');

            logger.$onResponse(buildCtx('/health/ready', 503));

            expect(errorSpy).not.toHaveBeenCalled();
        });
    });

});

