import type { LogLevel } from './LogLevel.enum.js';

/**
 * Options for creating a Logger instance.
 *
 * @typeParam T - Shape of the `attributes` object passed to each log method.
 */
export interface LoggerOptions<T extends object = object> {
    /** Whether to enable logging. Defaults to `true`. */
    readonly enabled?: boolean;
    /** Minimum log level to emit. Defaults to `INFO`. */
    readonly logLevel?: LogLevel;
    /**
     * Optional callback invoked on every log call to supply base attributes
     * (e.g. request-id, trace-id, tenant-id) that are merged with any
     * per-call `meta` argument. Per-call values take precedence.
     *
     * @example
     * ```typescript
     * const logger = new Logger({ metaProvider: () => ({ requestId: getRequestId() }) });
     * logger.info('request received'); // attributes includes requestId automatically
     * ```
     */
    readonly metaProvider?: () => Partial<T>;
}
