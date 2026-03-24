import { AppendersRegistry, LogContext, LogEvent, $log, levels } from '@tsed/logger';
import { Logger } from '@radoslavirha/tsed-logger';
import { describe, beforeEach, afterEach, expect, vi, it, type MockInstance } from 'vitest';
import { TsEDLoggerBridge, configureTsEDLoggerBridge } from './TsEDLoggerBridge.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChildLoggerMock {
    fatal: MockInstance;
    error: MockInstance;
    warn: MockInstance;
    info: MockInstance;
    debug: MockInstance;
    trace: MockInstance;
}

function makeChildMock(): ChildLoggerMock {
    return {
        fatal: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn()
    };
}

function makeLogEvent(level: ReturnType<typeof levels>[keyof ReturnType<typeof levels>], data: unknown[]): LogEvent {
    return new LogEvent('test', level, data, new LogContext());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TsEDLoggerBridge', () => {
    let logger: Logger;
    let child: ChildLoggerMock;
    let clearSpy: MockInstance;
    let setSpy: MockInstance;

    beforeEach(() => {
        logger = new Logger();
        child = makeChildMock();
        vi.spyOn(logger, 'child').mockReturnValue(child as never);

        clearSpy = vi.spyOn($log.appenders, 'clear');
        setSpy = vi.spyOn($log.appenders, 'set');
    });

    afterEach(() => vi.restoreAllMocks());

    describe('configureTsEDLoggerBridge()', () => {
        it('creates a child logger scoped to TsED', () => {
            configureTsEDLoggerBridge(logger);

            expect(logger.child).toHaveBeenCalledWith('TsED');
        });

        it('clears existing $log appenders', () => {
            configureTsEDLoggerBridge(logger);

            expect(clearSpy).toHaveBeenCalledOnce();
        });

        it('registers the bridge appender on $log', () => {
            configureTsEDLoggerBridge(logger);

            expect(setSpy).toHaveBeenCalledWith('logger', { type: 'logger-bridge' });
        });

        it('sets $log.level to all', () => {
            configureTsEDLoggerBridge(logger);

            expect($log.level.toLowerCase()).toBe('all');
        });

        describe('log forwarding', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let AppenderClass: new (config: any) => { write: (event: LogEvent) => void };

            beforeEach(() => {
                configureTsEDLoggerBridge(logger);
                // After configureTsEDLoggerBridge the appender is guaranteed to be registered
                AppenderClass = AppendersRegistry.get('logger-bridge')!.provide;
            });

            const cases: Array<[string, keyof ChildLoggerMock]> = [
                ['FATAL', 'fatal'],
                ['ERROR', 'error'],
                ['WARN', 'warn'],
                ['INFO', 'info'],
                ['DEBUG', 'debug'],
                ['TRACE', 'trace']
            ];

            for (const [tsedLevel, logMethod] of cases) {
                it(`forwards ${tsedLevel} events to logger.${logMethod}()`, () => {
                    const instance = new AppenderClass({ type: 'radoslavirha-bridge', options: {} });
                    const tsedLevels = levels();
                    const level = tsedLevels[tsedLevel as keyof typeof tsedLevels];
                    const event = makeLogEvent(level, ['Test message']);

                    instance.write(event);

                    expect(child[logMethod]).toHaveBeenCalledWith('Test message');
                });
            }

            it('serializes non-string data to JSON', () => {
                const instance = new AppenderClass({ type: 'radoslavirha-bridge', options: {} });
                const payload = { code: 400, reason: 'bad request' };
                const event = makeLogEvent(levels().ERROR, [payload]);

                instance.write(event);

                expect(child.error).toHaveBeenCalledWith(JSON.stringify(payload));
            });

            it('produces empty string message when data array is empty', () => {
                const instance = new AppenderClass({ type: 'radoslavirha-bridge', options: {} });
                const event = makeLogEvent(levels().WARN, []);

                instance.write(event);

                expect(child.warn).toHaveBeenCalledWith('');
            });
        });
    });

    describe('TsEDLoggerBridge class', () => {
        it('constructor configures the $log bridge with the injected Logger', () => {
            new TsEDLoggerBridge(logger);

            expect(logger.child).toHaveBeenCalledWith('TsED');
            expect(clearSpy).toHaveBeenCalledOnce();
            expect(setSpy).toHaveBeenCalledWith('logger', { type: 'logger-bridge' });
        });
    });
});
