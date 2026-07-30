import { beforeEach, afterEach, describe, expect, it, vi, MockInstance } from 'vitest';
import { OverrideProvider } from '@tsed/di';
import { PlatformTest } from '@tsed/platform-http/testing';
import SuperTest from 'supertest';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions, LoggerOptionsInput } from './RequestLogOptions.schema.js';
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
    @OverrideProvider(Logger)
    class TestLogger extends Logger {
        private static _options: LoggerOptions = LoggerOptionsSchema.parse({
            enabled: false,
            requests: {
                enabled: false
            }
        });

        public static configure(opts: LoggerOptionsInput): void {
            TestLogger._options = LoggerOptionsSchema.parse(opts);
        }

        public constructor() {
            super(TestLogger._options);
        }
    }

    describe('with all request logging options enabled', () => {
        let request: SuperTest.Agent;
        let stdoutSpy: MockInstance;
        let stderrSpy: MockInstance;

        beforeEach(async () => {
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
            TestLogger.configure({
                enabled: true,
                requests: {
                    enabled: true,
                    headers: { enabled: true },
                    query: { enabled: true },
                    request: { enabled: true },
                    response: { enabled: true },
                    stack: true
                }
            });
            await PlatformTest.bootstrap(TestServer)();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy.mockClear();
            stderrSpy.mockClear();
        });

        afterEach(async () => {
            vi.restoreAllMocks();
            await PlatformTest.reset();
        });

        it('logs a completed request at INFO level on a 2xx response', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => {
                return (l as Record<string, unknown>)?.['message'] === 'Request completed'
                    && (l as Record<string, unknown>)?.['scope'] === 'HTTP_REQUEST';
            }) as Record<string, unknown> | undefined;

            expect(entry).toBeDefined();
            expect(entry?.['level']).toBe('info');
        });

        it('emits one Request completed log per successful request', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);
            const completed = logs.filter((l: unknown) => {
                return (l as Record<string, unknown>)?.['message'] === 'Request completed'
                    && (l as Record<string, unknown>)?.['scope'] === 'HTTP_REQUEST';
            });

            expect(completed).toHaveLength(1);
        });

        it('includes method, url, status, and duration in the completed log', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']).toMatchObject({
                method: 'GET',
                url: '/test/success',
                status: 200
            });
            expect(typeof entry?.['attributes']?.['duration']).toBe('number');
            expect(Number(entry?.['attributes']?.['duration'])).toBeGreaterThanOrEqual(0);
        });

        it('includes stringified headers, query, request, and response in the completed log', async () => {
            await request.get('/test/success').query({ page: '1' }).set('x-api-key', 'token');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;
            const attributes = entry?.['attributes'] ?? {};

            expect(typeof attributes['headers']).toBe('string');
            expect(typeof attributes['query']).toBe('string');
            expect(typeof attributes['response']).toBe('string');

            expect(JSON.parse(String(attributes['headers']))).toMatchObject({ 'x-api-key': 'token' });
            expect(JSON.parse(String(attributes['query']))).toMatchObject({ page: '1' });
            expect(JSON.parse(String(attributes['response']))).toMatchObject({ ok: true });
        });

        it('logs parsed POST payload and response body for JSON requests', async () => {
            const payload: Record<string, unknown> = {
                user: { id: 'u-1' },
                enabled: true
            };
            const response = await request
                .post('/test/echo')
                .query({ source: 'post' })
                .set('x-api-key', 'token')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                ok: true,
                method: 'POST',
                body: payload
            });

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;
            const attributes = entry?.['attributes'] ?? {};

            expect(JSON.parse(String(attributes['query']))).toMatchObject({ source: 'post' });
            expect(JSON.parse(String(attributes['request']))).toMatchObject(payload);
            expect(JSON.parse(String(attributes['response']))).toMatchObject({
                ok: true,
                method: 'POST',
                body: payload
            });
        });

        it('logs parsed PATCH payload and response body for JSON requests', async () => {
            const payload: Record<string, unknown> = {
                status: 'active'
            };
            const response = await request
                .patch('/test/echo')
                .query({ source: 'patch' })
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                ok: true,
                method: 'PATCH',
                body: payload
            });

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;
            const attributes = entry?.['attributes'] ?? {};

            expect(JSON.parse(String(attributes['query']))).toMatchObject({ source: 'patch' });
            expect(JSON.parse(String(attributes['request']))).toMatchObject(payload);
            expect(JSON.parse(String(attributes['response']))).toMatchObject({
                ok: true,
                method: 'PATCH',
                body: payload
            });
        });

        it('logs a failed request at ERROR level on a 5xx response', async () => {
            await request.get('/test/error');

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => {
                return (l as Record<string, unknown>)?.['message'] === 'Request failed'
                    && (l as Record<string, unknown>)?.['scope'] === 'HTTP_REQUEST';
            }) as Record<string, unknown> | undefined;

            expect(entry).toBeDefined();
            expect(entry?.['level']).toBe('error');
        });

        it('includes error_name, error_message, and error_stack in the failed request log', async () => {
            await request.get('/test/error');

            const logs = parseLogs(stderrSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request failed') as Record<string, Record<string, unknown>>;
            const errorStack = entry?.['attributes']?.['error_stack'];

            expect(entry?.['attributes']).toMatchObject({
                error_name: 'Error',
                error_message: 'Something went wrong'
            });
            expect(typeof errorStack).toBe('string');
            expect(String(errorStack).startsWith('Error: Something went wrong')).toBe(true);
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

        it('logs [[ BINARY ]] as response when Content-Type is application/octet-stream', async () => {
            await request.get('/test/binary');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry?.['attributes']).toMatchObject({
                response: '[[ BINARY ]]'
            });
        });

        it('logs stringified response when Content-Type is application/json', async () => {
            await request.get('/test/success');

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;
            const responseBody = entry?.['attributes']?.['response'];

            expect(typeof responseBody).toBe('string');
            expect(JSON.parse(String(responseBody))).toMatchObject({ ok: true });
        });
    });

    describe('with request logging disabled', () => {
        let request: SuperTest.Agent;
        let stdoutSpy: MockInstance;
        let stderrSpy: MockInstance;

        beforeEach(async () => {
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
            TestLogger.configure({ requests: { enabled: false } });
            await PlatformTest.bootstrap(TestServer)();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy.mockClear();
            stderrSpy.mockClear();
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
        let stdoutSpy: MockInstance;
        let stderrSpy: MockInstance;

        beforeEach(async () => {
            stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
            stderrSpy = vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
            TestLogger.configure({
                requests: {
                    enabled: true,
                    headers: { enabled: false },
                    query: { enabled: false },
                    request: { enabled: false },
                    response: { enabled: false },
                    stack: false
                }
            });
            await PlatformTest.bootstrap(TestServer)();
            request = SuperTest(PlatformTest.callback());
            stdoutSpy.mockClear();
            stderrSpy.mockClear();
        });

        afterEach(async () => {
            vi.restoreAllMocks();
            await PlatformTest.reset();
        });

        it('omits headers, query, request, and response from the completed log', async () => {
            await request.get('/test/success').query({ page: '1' });

            const logs = parseLogs(stdoutSpy);
            const entry = logs.find((l: unknown) => (l as Record<string, unknown>)?.['message'] === 'Request completed') as Record<string, Record<string, unknown>>;

            expect(entry).toBeDefined();
            expect(entry?.['attributes']).not.toHaveProperty('headers');
            expect(entry?.['attributes']).not.toHaveProperty('query');
            expect(entry?.['attributes']).not.toHaveProperty('request');
            expect(entry?.['attributes']).not.toHaveProperty('response');
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

