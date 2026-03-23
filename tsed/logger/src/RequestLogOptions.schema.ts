import { z } from 'zod';

import { LogLevel } from '@radoslavirha/logger';

/**
 * Zod schema for {@link LoggerOptions} — the full Logger constructor options.
 *
 * All fields are optional; defaults are applied on `.parse()`. All request-logging
 * fields default to `true` (opt-out semantics).
 *
 * ### Usage in an API
 *
 * ```typescript
 * import { LoggerOptionsSchema } from '@radoslavirha/tsed-logger';
 *
 * const raw = config.logger;                    // loaded from JSON / env
 * const options = LoggerOptionsSchema.parse(raw); // throws ZodError on invalid input
 * // metaProvider is a runtime callback — pass it as the second argument:
 * const logger = new Logger(options, () => ({ requestId: getRequestId() }));
 * ```
 */
export const LoggerOptionsSchema = z.object({
    /** Enable or disable all logging. Default: `true`. */
    enabled: z.boolean().default(true),
    /** Minimum log level to emit. Default: `INFO`. */
    logLevel: z.enum(LogLevel).default(LogLevel.INFO).describe('Logging level.'),
    /** HTTP request/response logging configuration. */
    requests: z.object({
        /** Enable or disable HTTP request/response logging entirely. Default: `true`. */
        enabled: z.boolean().default(true),
        /** Include raw request headers in the log entry. Default: `true`. */
        headers: z.object({
            enabled: z.boolean().default(true)
        }).default(() => ({ enabled: true })),
        /** Include query-string parameters in the log entry. Default: `true`. */
        query: z.object({
            enabled: z.boolean().default(true)
        }).default(() => ({ enabled: true })),
        /** Include the parsed request body in the log entry. Default: `true`. */
        payload: z.object({
            enabled: z.boolean().default(true)
        }).default(() => ({ enabled: true })),
        /** Include the endpoint return value (response body) in the log entry. Default: `true`. */
        responseBody: z.object({
            enabled: z.boolean().default(true)
        }).default(() => ({ enabled: true })),
        /** Include the error stack trace in error log entries. Default: `true`. */
        stack: z.boolean().default(true)
    }).default(() => ({
        enabled: true,
        headers: { enabled: true },
        query: { enabled: true },
        payload: { enabled: true },
        responseBody: { enabled: true },
        stack: true
    }))
}).describe('Logger configuration.');

/**
 * Input type for {@link LoggerOptionsSchema} — all fields optional (defaults applied on parse).
 *
 * Use as the constructor parameter type of {@link Logger}. Parse with
 * {@link LoggerOptionsSchema} at start-up to fill in defaults before
 * constructing the logger.
 */
export type LoggerOptions = z.input<typeof LoggerOptionsSchema>;
