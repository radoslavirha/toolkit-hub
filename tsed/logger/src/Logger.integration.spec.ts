import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Injectable, OverrideProvider, Scope, ProviderScope } from '@tsed/di';
import { PlatformTest } from '@tsed/platform-http/testing';
import SuperTest from 'supertest';

import type { LoggerOptions } from './RequestLogOptions.schema.js';
import { Logger } from './Logger.js';
import { TestServer } from './test/TestServer.js';

// ---------------------------------------------------------------------------
// Helper — parse captured stdout / stderr writes into JSON log objects.
// Non-JSON writes (Ts.ED internal output) are silently discarded.
//
// Note: Winston's Console transport calls `console._stdout.write()` / `console._stderr.write()` directly.
// In Vitest's worker thread `console._stdout !== process.stdout`, so spies must
// target `console._stdout` / `console._stderr` to intercept Winston output.
// ---------------------------------------------------------------------------

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

const parseLogs = (spy: { mock: { calls: unknown[][] } }): unknown[] =>
    spy.mock.calls
        .flatMap(([chunk]) => {
            try {
                return [JSON.parse(String(chunk))];
            } catch {
                return [];
            }
        });



// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

/**
 * Logger integration tests.
 *
 * Every test bootstraps a real Ts.ED server (TestServer) and makes HTTP calls
 * via SuperTest. The Logger's `$onResponse` is exercised through the actual
 * Ts.ED request lifecycle — it is never called directly in these tests.
 *
 * Log output is captured by spying on `console._stdout` / `console._stderr`
 * (the streams Winston writes to directly) immediately before each HTTP call.
 * Winston's Console transport operates synchronously, so all entries are present
 * by the time the SuperTest `await` resolves.
 *
 * `$onResponse` is never called directly in these tests — Ts.ED automatically
 * invokes it on the registered TestLogger singleton after each HTTP response.
 */
describe('Logger (integration)', () => {
    // ---------------------------------------------------------------------------
    // A single @OverrideProvider class is defined here (inside the outer describe
    // scope, not at module level). Its options are set via the static `configure`
    // method in each inner `beforeEach` BEFORE bootstrapping the platform, so
    // there is no shared mutable state that could leak between test suites.
    // ---------------------------------------------------------------------------
    @Injectable()
    @OverrideProvider(Logger)
    @Scope(ProviderScope.SINGLETON)
    class TestLogger extends Logger {
        private static _options: LoggerOptions = {};

        public static configure(opts: LoggerOptions): void {
            TestLogger._options = opts;
        }

        public constructor() {
            super(TestLogger._options);
        }
    }

    describe('with all request logging options enabled', () => {
        let request: SuperTest.Agent;
        let stdoutSpy: { mock: { calls: unknown[][] } };
        let stderrSpy: { mock: { calls: unknown[][] } };

        beforeEach(async () => {
            TestLogger.configure({
                enabled: true,
                requests: {
                    enabled: true,
                    headers: { enabled: true },
                    query: { enabled: true },
                    payload: { enabled: true },
                    responseBody: { enabled: true },
                    stack: true
                }
            });
            await PlatformTest.bootstrap(TestServer, { imports: [TestLogger] })();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write');
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write');
        });

        afterEach(async () => {
            vi.restoreAllMocks();
            await PlatformTest.reset();
        });

        it('logs a completed request at INFO level on a 2xx response', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);

            expect(logs).toContainEqual(expect.objectContaining({
                level: 'info',
                message: 'Request completed',
                scope: 'HTTP_REQUEST'
            }));
        });

        it('includes method, url, status, and duration in the completed log', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']).toMatchObject({
                method: 'GET',
                url: expect.stringContaining('/test/success'),
                status: 200,
                duration: expect.any(Number)
            });
        });

        it('includes headers, query, requestBody, and responseBody in the completed log', async () => {
            await request.get('/test/success').query({ page: '1' }).set('x-api-key', 'token');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']).toMatchObject({
                headers: expect.objectContaining({ 'x-api-key': 'token' }),
                query: expect.objectContaining({ page: '1' }),
                responseBody: expect.objectContaining({ ok: true })
            });
        });

        it('logs a failed request at ERROR level on a 5xx response', async () => {
            await request.get('/test/error');

            const logs = parseLogs(stderrSpy);

            expect(logs).toContainEqual(expect.objectContaining({
                level: 'error',
                message: 'Request failed',
                scope: 'HTTP_REQUEST'
            }));
        });

        it('includes error_name, error_message, and error_stack in the failed request log', async () => {
            await request.get('/test/error');

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request failed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']).toMatchObject({
                error_name: 'Error',
                error_message: 'Something went wrong',
                error_stack: expect.stringContaining('Error: Something went wrong')
            });
        });

        it('uses error.code as error_name when error.name is undefined', async () => {
            await request.get('/test/code-error');

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request failed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']?.['error_name']).toBe('ENOENT');
        });

        it('logs a 4xx response without error fields when $ctx.error is null', async () => {
            const res = await request.get('/test/handled-error');
            expect(res.status).toBe(400);

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request failed') as Record<string, Record<string, unknown>>;

            expect(entry).toBeDefined();
            expect(entry?.['attributes']).not.toHaveProperty('error_name');
            expect(entry?.['attributes']).not.toHaveProperty('error_message');
        });
    });

    describe('with request logging disabled', () => {
        let request: SuperTest.Agent;
        let stdoutSpy: { mock: { calls: unknown[][] } };
        let stderrSpy: { mock: { calls: unknown[][] } };

        beforeEach(async () => {
            TestLogger.configure({ requests: { enabled: false } });
            await PlatformTest.bootstrap(TestServer, { imports: [TestLogger] })();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write');
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write');
        });

        afterEach(async () => {
            vi.restoreAllMocks();
            await PlatformTest.reset();
        });

        it('does not emit any HTTP_REQUEST log when requests.enabled is false', async () => {
            await request.get('/test/success');
            await request.get('/test/error');

            const all = [...parseLogs(stdoutSpy), ...parseLogs(stderrSpy)];
            const httpLogs = all.filter((l: unknown) => (l as Record<string, unknown>)?.['scope'] === 'HTTP_REQUEST');

            expect(httpLogs).toHaveLength(0);
        });
    });

    describe('with all sub-options disabled', () => {
        let request: SuperTest.Agent;
        let stdoutSpy: { mock: { calls: unknown[][] } };
        let stderrSpy: { mock: { calls: unknown[][] } };

        beforeEach(async () => {
            TestLogger.configure({
                requests: {
                    enabled: true,
                    headers: { enabled: false },
                    query: { enabled: false },
                    payload: { enabled: false },
                    responseBody: { enabled: false },
                    stack: false
                }
            });
            await PlatformTest.bootstrap(TestServer, { imports: [TestLogger] })();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write');
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write');
        });

        afterEach(async () => {
            vi.restoreAllMocks();
            await PlatformTest.reset();
        });

        it('omits headers, query, requestBody, and responseBody from the completed log', async () => {
            await request.get('/test/success').query({ page: '1' });

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry).toBeDefined();
            expect(entry?.['attributes']).not.toHaveProperty('headers');
            expect(entry?.['attributes']).not.toHaveProperty('query');
            expect(entry?.['attributes']).not.toHaveProperty('requestBody');
            expect(entry?.['attributes']).not.toHaveProperty('responseBody');
        });

        it('omits error_stack from the failed request log', async () => {
            await request.get('/test/error');

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request failed') as Record<string, Record<string, unknown>>;

            expect(entry).toBeDefined();
            expect(entry?.['attributes']).not.toHaveProperty('error_stack');
        });
    });
});

