import type { LogLevel } from './LogLevel.enum.js';

/**
 * Options for creating a Logger instance.
 */
export interface LoggerOptions {
    /** Whether to enable logging. Defaults to `true`. */
    readonly enabled?: boolean;
    /** Minimum log level to emit. Defaults to `INFO`. */
    readonly logLevel?: LogLevel;
}
