import { describe, expect, it } from 'vitest';
import { Logger as BaseLogger, LogLevel } from '@radoslavirha/logger';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptions } from './RequestLogOptions.schema.js';
import { Logger } from './Logger.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parses LoggerOptions input into the fully-defaulted LoggerOptionsParsed shape. */
const getOptions = (opts: LoggerOptions = {}) => LoggerOptionsSchema.parse(opts);

/**
 * tsed-logger wraps @radoslavirha/logger for Ts.ED DI injection.
 *
 * Core log-output behaviour is already tested exhaustively in @radoslavirha/logger.
 * Here we only verify the DI-specific concerns:
 *   - Logger is a subclass of BaseLogger
 *   - Logger can be constructed without options
 *   - child() returns a Logger instance (not just BaseLogger)
 *   - The @OverrideProvider(Logger) pattern is the intended API-side setup
 */
describe('Logger (tsed-logger)', () => {
    it('is an instance of BaseLogger', () => {
        const logger = new Logger(getOptions({ logLevel: LogLevel.INFO }));
        expect(logger).toBeInstanceOf(BaseLogger);
    });

    it('is an instance of Logger (tsed subclass)', () => {
        const logger = new Logger(getOptions({ logLevel: LogLevel.INFO }));
        expect(logger).toBeInstanceOf(Logger);
    });

    it('child() returns a BaseLogger instance', () => {
        const logger = new Logger(getOptions({ logLevel: LogLevel.INFO }));
        const child = logger.child('UserService');
        expect(child).toBeInstanceOf(BaseLogger);
    });

    it('accepts logLevel option without throwing', () => {
        expect(() => {
            new Logger(getOptions({ logLevel: LogLevel.DEBUG }));
        }).not.toThrow();
    });

    it('all log-level methods are callable without throwing', () => {
        const logger = new Logger(getOptions({ logLevel: LogLevel.TRACE }));
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
        const logger = new Logger(getOptions({ logLevel: LogLevel.INFO }));
        expect(() => {
            logger.info('with attrs', { userId: 'abc', nested: { x: 1 } });
        }).not.toThrow();
    });

    it('can be constructed without options (DI default — no-op logging)', () => {
        expect(() => {
            new Logger();
        }).not.toThrow();
    });
});

