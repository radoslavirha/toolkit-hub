import { describe, beforeEach, afterEach, expect, it, vi, MockInstance } from 'vitest';
import { PlatformTest } from '@tsed/platform-http/testing';
import { BaseServer } from './BaseServer.js';
import SuperTest from 'supertest';
import { $log } from '@tsed/logger';
import { LogLevel } from '@radoslavirha/tsed-logger';
import { TsEDLoggerBridge } from './TsEDLoggerBridge.js';
import { TestController } from './test/TestController.js';

const parseLogs = (spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] =>
    spy.mock.calls
        .flatMap(([chunk]) => {
            try {
                return [JSON.parse(String(chunk)) as Record<string, unknown>];
            } catch {
                return [];
            }
        });

describe('TsEDLoggerBridge', () => {
    let stdoutSpy: MockInstance;
    let bridge: TsEDLoggerBridge;

    const spyOnBridgeLog = (): MockInstance =>
        vi.spyOn((bridge as unknown as { logger: { log: (level: LogLevel, message: string) => void } }).logger, 'log');

    beforeEach(async () => {
        const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream };
        stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        bridge = await PlatformTest.invoke<TsEDLoggerBridge>(TsEDLoggerBridge);
        await PlatformTest.bootstrap(BaseServer, {
            logger: bridge.getTsEDLoggerConfig(),
            mount: {
                '/': [TestController]
            }
        })();
    });

    afterEach(async () => {
        stdoutSpy.mockRestore();
        await PlatformTest.reset();
    });

    it('should forward initial Ts.ED logs to our logger', async () => {
        // assert
        const logs = parseLogs(stdoutSpy);
        expect(logs[0].message).toContain('Loading EXPRESS platform adapter');
        expect(logs[0].scope).toBe('TSED');
    });

    it('should forward Ts.ED request log (@tsed/platform-log-request if provided) to logger', async () => {
        // arrange
        const request = SuperTest(PlatformTest.callback());

        // act
        await request
            .get('/');

        // assert
        const requestLog = parseLogs(stdoutSpy).find((log) => (log.message as string).includes('Request finished in'));
        expect(requestLog).toBeDefined();
    });

    it('should keep the Error message and stack when Ts.ED logs logger.error("msg", error)', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act
        $log.error('Failed to connect', new Error('ECONNREFUSED 127.0.0.1:6379'));

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        const [level, message] = logSpy.mock.calls[0];
        expect(level).toBe(LogLevel.ERROR);
        expect(message).toContain('Failed to connect');
        expect(message).toContain('ECONNREFUSED 127.0.0.1:6379');
        expect(message).toContain('TsEDLoggerBridge.spec.ts');
    });

    it('should keep the Error message when the Error is the only argument', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act
        $log.error(new Error('boom'));

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0][1]).toContain('boom');
    });

    it('should not throw and keep the null when a Ts.ED log call has a null argument', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act & assert
        expect(() => $log.info('cached value:', null)).not.toThrow();
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0]).toEqual([LogLevel.INFO, 'cached value: null']);
    });

    it('should forward an Error nested in a structured Ts.ED log object as metadata', () => {
        // arrange
        const logSpy = spyOnBridgeLog();
        const error = new Error('ENOENT views');

        // act — the shape Ts.ED itself logs, e.g. PlatformExpress PLATFORM_VIEWS_ERROR
        $log.warn({ event: 'PLATFORM_VIEWS_ERROR', message: 'Unable to configure the PlatformViews service', error });

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0]).toEqual([
            LogLevel.WARN,
            'Unable to configure the PlatformViews service',
            { event: 'PLATFORM_VIEWS_ERROR', error }
        ]);
    });

    it('should forward plain object arguments as metadata', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act
        $log.error('Payment failed', { orderId: 'ord_42' });

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0]).toEqual([LogLevel.ERROR, 'Payment failed', { orderId: 'ord_42' }]);
    });

    it('should forward array arguments as metadata data', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act
        $log.info('Skipped ids', ['a1', 'b2']);

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0]).toEqual([LogLevel.INFO, 'Skipped ids', { data: ['a1', 'b2'] }]);
    });

    it('should not let object arguments overwrite the toolkit logger fields', () => {
        // arrange
        const logSpy = spyOnBridgeLog();

        // act
        $log.info('Cache warmed', { level: 'x', scope: 'y', timestamp: 'z', keys: 3 });

        // assert
        expect(logSpy).toHaveBeenCalledOnce();
        expect(logSpy.mock.calls[0]).toEqual([LogLevel.INFO, 'Cache warmed', { keys: 3 }]);
    });

    it('should write the nested Error to the log output', () => {
        // act
        $log.warn({ event: 'PLATFORM_VIEWS_ERROR', message: 'Unable to configure the PlatformViews service', error: new Error('ENOENT views') });

        // assert
        const log = parseLogs(stdoutSpy).find((entry) => entry.event === 'PLATFORM_VIEWS_ERROR');
        expect(log).toMatchObject({ scope: 'TSED', message: 'Unable to configure the PlatformViews service', error: { message: 'ENOENT views' } });
    });

    it('should not throw on non-string message or data', async () => {
        // arrange
        const process = (event: Record<string, unknown>): void =>
            (bridge as unknown as { processLogEvent: (l: LogLevel, e: Record<string, unknown>) => void })
                .processLogEvent(LogLevel.ERROR, event);
        const logSpy = spyOnBridgeLog();

        // act & assert
        expect(() => process({ data: ['failed', new Error('boom'), { a: 1 }, 42] })).not.toThrow();
        expect(() => process({ message: 42 })).not.toThrow();
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        expect(() => process({ data: [circular, undefined] })).not.toThrow();

        const messages = logSpy.mock.calls.map(([, message]) => message as string);
        expect(messages[0]).toContain('failed');
        expect(messages[0]).toContain('boom');
        expect(messages[0]).toContain('{"a":1}');
        expect(messages[0]).toContain('42');
        expect(messages[1]).toBe('42');
    });
});
