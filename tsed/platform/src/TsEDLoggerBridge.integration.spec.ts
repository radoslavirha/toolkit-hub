import { Injectable, OverrideProvider, Scope, ProviderScope } from '@tsed/di';
import { PlatformTest } from '@tsed/platform-http/testing';
import { Logger, LogLevel } from '@radoslavirha/tsed-logger';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { BaseServer } from './BaseServer.js';
import { TestController } from './test/TestController.js';

// ---------------------------------------------------------------------------
// Winston's Console transport writes directly to `console._stdout`/`_stderr`.
// In Vitest's worker thread these differ from `process.stdout`, so we must spy
// on `console._stdout` to intercept our Logger's JSON output.
//
// The spy is installed BEFORE PlatformTest.bootstrap so that log lines emitted
// during the Ts.ED DI initialization sequence are captured.
// ---------------------------------------------------------------------------

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream };

const parseLogs = (spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] =>
    spy.mock.calls
        .flatMap(([chunk]) => {
            try {
                return [JSON.parse(String(chunk)) as Record<string, unknown>];
            } catch {
                return [];
            }
        });

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('TsEDLoggerBridge (integration)', () => {
    // Override the DI Logger with DEBUG level so every Ts.ED $log call
    // (including debug-level bootstrap messages) passes through Winston to stdout.
    @Injectable()
    @OverrideProvider(Logger)
    @Scope(ProviderScope.SINGLETON)
    class TestLogger extends Logger {
        public constructor() {
            super({ enabled: true, level: LogLevel.DEBUG });
        }
    }

    let stdoutSpy: { mock: { calls: unknown[][] } };

    beforeEach(() => {
        // Must be installed BEFORE bootstrap to capture initialization logs.
        stdoutSpy = vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
    });

    beforeEach(PlatformTest.bootstrap(BaseServer, {
        imports: [TestLogger],
        mount: { '/': [TestController] }
    }));

    afterEach(PlatformTest.reset);
    afterEach(() => vi.restoreAllMocks());

    it('forwards Ts.ED framework logs to the Logger with scope TsED during bootstrap', () => {
        const tsedLogs = parseLogs(stdoutSpy).filter((log) => log['scope'] === 'TsED');

        expect(tsedLogs.length).toBeGreaterThan(0);
    });

    it('emitted Ts.ED log entries carry level and message fields', () => {
        const tsedLogs = parseLogs(stdoutSpy).filter((log) => log['scope'] === 'TsED');

        for (const log of tsedLogs) {
            expect(log).toMatchObject({
                scope: 'TsED',
                level: expect.any(String),
                message: expect.any(String)
            });
        }
    });

    it('does not emit the default $log colored-text format', () => {
        // The default Ts.ED ConsoleAppender writes: "[2024-01-01T...] [INFO] [category] - message"
        // If the bridge replaced it correctly, none of the captured writes should match this pattern.
        const allWrites = stdoutSpy.mock.calls.map(([chunk]) => String(chunk));
        const hasDefaultFormatOutput = allWrites.some((w) => /\[\d{4}-\d{2}-\d{2}/.test(w));

        expect(hasDefaultFormatOutput).toBe(false);
    });
});
