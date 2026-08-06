import { z } from 'zod';

import { LogLevel } from '@radoslavirha/logger';
import { RedactionFieldOptionsSchema } from '@radoslavirha/redaction';

/**
 * Per-source redaction options. Re-exported from `@radoslavirha/redaction` so
 * inbound request logging shares one configuration vocabulary with every other
 * package that redacts (outbound HTTP, storage, messaging).
 */
const RequestFieldOptionsSchema = RedactionFieldOptionsSchema;

const RequestFieldOptionsDefaultSchema = RequestFieldOptionsSchema.default(() => ({
    enabled: true,
    redactPaths: []
}));

const LoggerRequestOptionsSchema = z.object({
    /** Enable or disable HTTP request/response logging entirely. Default: `true`. */
    enabled: z.boolean().default(true),
    /** Include raw request headers in the log entry. Default: `true`. */
    headers: RequestFieldOptionsDefaultSchema,
    /** Include query-string parameters in the log entry. Default: `true`. */
    query: RequestFieldOptionsDefaultSchema,
    /** Include the parsed request payload in the log entry. Default: `true`. */
    request: RequestFieldOptionsDefaultSchema,
    /** Include the endpoint return value (response payload) in the log entry. Default: `true`. */
    response: RequestFieldOptionsDefaultSchema,
    /** Include the error stack trace in error log entries. Default: `true`. */
    stack: z.boolean().default(true),
    /**
     * Request paths to exclude from HTTP request/response logging. Matched against
     * the request pathname (query string stripped) as an anchored prefix: an entry
     * `/health` suppresses `/health`, `/health/live` and `/health/ready`, but not
     * `/healthcheck`. Kubernetes probe endpoints are excluded by default — they run
     * every few seconds for the life of the pod and carry no information.
     */
    ignorePaths: z.array(z.string()).default(['/health', '/healthz'])
}).default(() => ({
    enabled: true,
    headers: { enabled: true, redactPaths: [] },
    query: { enabled: true, redactPaths: [] },
    request: { enabled: true, redactPaths: [] },
    response: { enabled: true, redactPaths: [] },
    stack: true,
    ignorePaths: ['/health', '/healthz']
}));

/**
 * Zod schema for logger configuration.
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
    level: z.enum(LogLevel).default(LogLevel.INFO).describe('Logging level.'),
    /** HTTP request/response logging configuration. */
    requests: LoggerRequestOptionsSchema
}).describe('Logger configuration.');

/**
 * Input type for {@link LoggerOptionsSchema} — all fields optional (defaults applied on parse).
 *
 * Use when collecting raw configuration values before schema parsing.
 */
export type LoggerOptionsInput = z.input<typeof LoggerOptionsSchema>;

/**
 * Parsed type for {@link LoggerOptionsSchema}.
 *
 * Use as constructor input for {@link Logger} after parsing raw configuration.
 */
export type LoggerOptions = z.output<typeof LoggerOptionsSchema>;

/**
 * Parsed type for per-source request logging options.
 */
export type LoggerRequestFieldOptions = z.output<typeof RequestFieldOptionsSchema>;
