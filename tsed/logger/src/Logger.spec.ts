import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Logger as BaseLogger, LogLevel } from '@radoslavirha/logger';
import { runInContext } from '@tsed/di';
import type { PlatformContext } from '@tsed/platform-http';
import { PlatformTest } from '@tsed/platform-http/testing';

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

/** Private members of Logger the tests reach into. */
type LoggerInternal = {
    $onResponse: ($ctx: PlatformContext) => void;
    httpLog: {
        info: (message: string, attributes: Record<string, unknown>) => void;
        error: (message: string, attributes: Record<string, unknown>) => void;
    };
    redaction: { collect: (sources: Record<string, unknown>) => Record<string, unknown> };
};

/** Fires the Logger's `$onResponse` hook inside the request's async context, as Ts.ED does. */
const respond = (logger: LoggerInternal, ctx: PlatformContext): Promise<void> =>
    runInContext(ctx, () => logger.$onResponse(ctx));

const buildLogger = (opts: LoggerOptionsInput = {}): LoggerInternal =>
    new Logger(getOptions(opts)) as unknown as LoggerInternal;

describe('Logger (tsed-logger)', () => {
    let $ctx: PlatformContext;

    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
        $ctx = PlatformTest.createRequestContext();
        $ctx.data = { ok: true };
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await $ctx.destroy();
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

    it('logs response body when content-type header is missing', async () => {
        const logger = buildLogger({ requests: { enabled: true, response: { enabled: true } } });
        const infoSpy = vi.spyOn(logger.httpLog, 'info');

        await respond(logger, $ctx);

        expect(infoSpy).toHaveBeenCalledTimes(1);
        const args = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
        expect(args[0]).toBe('Request completed');
        expect(args[1]['response']).toBe('{"ok":true}');
    });

    describe('response content-type', () => {
        it.each([
            'application/problem+json',
            'application/vnd.api+json',
            'application/hal+json; charset=utf-8',
            'application/atom+xml'
        ])('logs the response body for structured-syntax suffix %s', async (contentType) => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');
            $ctx.response.setHeader('content-type', contentType);

            await respond(logger, $ctx);

            const args = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
            expect(args[1]['response']).toBe('{"ok":true}');
        });

        it.each([
            'application/octet-stream',
            'application/jsonp',
            'application/vnd.ms-excel'
        ])('logs [[ BINARY ]] for non-text type %s', async (contentType) => {
            const logger = buildLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');
            $ctx.response.setHeader('content-type', contentType);

            await respond(logger, $ctx);

            const args = infoSpy.mock.calls[0] as [string, Record<string, unknown>];
            expect(args[1]['response']).toBe('[[ BINARY ]]');
        });
    });

    describe('requests.ignorePaths', () => {
        const buildIgnoringLogger = (ignorePaths?: string[]): LoggerInternal =>
            buildLogger({ requests: { enabled: true, ...(ignorePaths ? { ignorePaths } : {}) } });

        it('suppresses a path under a default ignore entry', async () => {
            const logger = buildIgnoringLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/health/live';
            await respond(logger, $ctx);

            expect(infoSpy).not.toHaveBeenCalled();
        });

        it('still logs a path outside the ignore list', async () => {
            const logger = buildIgnoringLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/api/things';
            await respond(logger, $ctx);

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('strips the query string before matching', async () => {
            const logger = buildIgnoringLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/health/ready?verbose=1';
            await respond(logger, $ctx);

            expect(infoSpy).not.toHaveBeenCalled();
        });

        it('matches only on a path-segment boundary', async () => {
            const logger = buildIgnoringLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/healthchecks-admin';
            await respond(logger, $ctx);

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('is case-sensitive', async () => {
            const logger = buildIgnoringLogger();
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/Health/live';
            await respond(logger, $ctx);

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('logs every path when ignorePaths is empty', async () => {
            const logger = buildIgnoringLogger([]);
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/health/live';
            await respond(logger, $ctx);

            expect(infoSpy).toHaveBeenCalledTimes(1);
        });

        it('does no redaction work for a suppressed request', async () => {
            const logger = buildIgnoringLogger();
            const collectSpy = vi.spyOn(logger.redaction, 'collect');

            $ctx.request.raw.url = '/health/live';
            await respond(logger, $ctx);

            expect(collectSpy).not.toHaveBeenCalled();
        });

        it('suppresses a failed request on an ignored path — the filter is about the path, not the outcome', async () => {
            const logger = buildIgnoringLogger();
            const errorSpy = vi.spyOn(logger.httpLog, 'error');

            $ctx.request.raw.url = '/health/ready';
            $ctx.response.status(503);
            await respond(logger, $ctx);

            expect(errorSpy).not.toHaveBeenCalled();
        });
    });

    describe('failed request error fields', () => {
        const failWith = async (thrown: unknown): Promise<Record<string, unknown>> => {
            const logger = buildLogger({ requests: { enabled: true } });
            const errorSpy = vi.spyOn(logger.httpLog, 'error');

            $ctx.response.status(500);
            ($ctx as unknown as { error: unknown }).error = thrown;
            await respond(logger, $ctx);

            return (errorSpy.mock.calls[0] as [string, Record<string, unknown>])[1];
        };

        it('keeps the message of a thrown string', async () => {
            const meta = await failWith('upstream timed out');

            expect(meta['error_message']).toBe('upstream timed out');
        });

        it('serialises a thrown plain object without a message', async () => {
            const meta = await failWith({ reason: 'upstream timed out' });

            expect(meta['error_message']).toBe('{"reason":"upstream timed out"}');
        });

        it('reads name and message from a thrown error-like object', async () => {
            const meta = await failWith({ name: 'UpstreamError', message: 'upstream timed out' });

            expect(meta['error_name']).toBe('UpstreamError');
            expect(meta['error_message']).toBe('upstream timed out');
        });

        it('reads name, message and stack from a thrown Error', async () => {
            const meta = await failWith(new TypeError('boom'));

            expect(meta['error_name']).toBe('TypeError');
            expect(meta['error_message']).toBe('boom');
            expect(meta['error_stack']).toContain('TypeError: boom');
        });
    });

    describe('url field', () => {
        it('does not leak query string values via url', async () => {
            const logger = buildLogger({
                requests: { enabled: true, query: { enabled: true, redactPaths: ['token'] } }
            });
            const infoSpy = vi.spyOn(logger.httpLog, 'info');

            $ctx.request.raw.url = '/cb?code=abc&token=s3cret';
            $ctx.request.raw.query = { code: 'abc', token: 's3cret' };
            await respond(logger, $ctx);

            const meta = (infoSpy.mock.calls[0] as [string, Record<string, unknown>])[1];
            expect(meta['url']).toBe('/cb');
            expect(JSON.stringify(meta)).not.toContain('s3cret');
        });
    });
});
