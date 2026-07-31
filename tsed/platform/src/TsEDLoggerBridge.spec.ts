import { describe, beforeEach, afterEach, expect, it, vi, MockInstance } from 'vitest';
import { PlatformTest } from '@tsed/platform-http/testing';
import { BaseServer } from './BaseServer.js';
import SuperTest from 'supertest';
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

    beforeEach(async () => {
        const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream };
        stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        const bridge = await PlatformTest.invoke<TsEDLoggerBridge>(TsEDLoggerBridge);
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
});
