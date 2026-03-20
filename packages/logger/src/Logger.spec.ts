import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import winston from 'winston';
import { Logger } from './Logger.js';
import { LogLevel } from './LogLevel.enum.js';

/**
 * Vitest runs in an isolated worker — `process.stdout` inside the test module
 * is a different reference than the one resolved inside Winston's Console
 * transport. We therefore cannot spy on `process.stdout.write`.
 *
 * Instead, we replace the default Console transport with a thin in-memory
 * transport and spy on Winston's underlying `write` stream, which IS the same
 * object in both scopes.
 */

let capturedLines: string[] = [];
let writeSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    capturedLines = [];
    writeSpy = vi.spyOn(winston.transports.Console.prototype, 'log').mockImplementation(
        (...args: unknown[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const info = args[0] as any;
            const callback = args[1] as (() => void) | undefined;
            capturedLines.push(info[Symbol.for('message')] as string);
            if (callback) callback();
        }
    );
});

afterEach(() => {
    writeSpy.mockRestore();
});

const getLine = (index = 0): Record<string, unknown> => {
    const raw = capturedLines[index];
    if (raw === undefined) throw new Error(`No log line at index ${index}. Lines captured: ${capturedLines.length}`);
    return JSON.parse(raw) as Record<string, unknown>;
};

describe('Logger', () => {
    describe('JSON output shape', () => {
        it('emits timestamp, level and message fields', () => {
            const logger = new Logger();
            logger.info('hello world');

            const line = getLine();
            expect(line['timestamp']).toBeDefined();
            expect(line['level']).toBe('info');
            expect(line['message']).toBe('hello world');
        });

        it('does not emit scope on root logger', () => {
            const logger = new Logger();
            logger.info('no scope');
            expect(getLine()).not.toHaveProperty('scope');
        });

        it('does not emit attributes field when not provided', () => {
            const logger = new Logger();
            logger.info('no attrs');
            expect(getLine()).not.toHaveProperty('attributes');
        });

        it('nests attributes under a single attributes key', () => {
            const logger = new Logger();
            logger.info('with attrs', { parent: { child: 'data' }, count: 3 });
            const line = getLine();
            expect(line['attributes']).toEqual({ parent: { child: 'data' }, count: 3 });
        });
    });

    describe('log level output', () => {
        it.each<[keyof Logger<object> & string, string]>([
            ['fatal', 'fatal'],
            ['error', 'error'],
            ['warn',  'warn'],
            ['info',  'info'],
            ['debug', 'debug'],
            ['trace', 'trace']
        ])('%s() emits level="%s"', (method, expectedLevel) => {
            const logger = new Logger({ logLevel: LogLevel.TRACE });
            (logger[method as keyof Logger<object>] as (body: string) => void)('test message');
            expect(getLine()['level']).toBe(expectedLevel);
        });
    });

    describe('child logger', () => {
        it('pins scope on every line', () => {
            const logger = new Logger();
            const child = logger.child('Service');
            child.info('child message');
            expect(getLine()['scope']).toBe('Service');
        });

        it('parent scope is not affected by child', () => {
            const logger = new Logger();
            logger.child('Service');
            logger.info('parent line');
            expect(getLine()).not.toHaveProperty('scope');
        });

        it('child scope does not bleed into sibling child', () => {
            const logger = new Logger();
            logger.child('ServiceA');
            const childB = logger.child('ServiceB');
            childB.info('from B');
            expect(getLine()['scope']).toBe('ServiceB');
        });
    });

    describe('enabled flag', () => {
        it('suppresses all logging when enabled=false', () => {
            const logger = new Logger({ enabled: false });
            logger.info('should not log');
            logger.error('also not logged');
            expect(capturedLines).toHaveLength(0);
        });

        it('child logger inherits enabled=false from parent', () => {
            const logger = new Logger({ enabled: false });
            const child = logger.child('AnyService');
            child.info('child should not log');
            expect(capturedLines).toHaveLength(0);
        });
    });

    describe('log level filtering', () => {
        it('suppresses logs below configured level', () => {
            const logger = new Logger({ logLevel: LogLevel.WARN });
            logger.info('should be suppressed');
            logger.debug('also suppressed');
            expect(capturedLines).toHaveLength(0);
        });

        it('emits logs at or above configured level', () => {
            const logger = new Logger({ logLevel: LogLevel.WARN });
            logger.warn('emitted');
            logger.error('also emitted');
            expect(capturedLines).toHaveLength(2);
        });
    });
});
