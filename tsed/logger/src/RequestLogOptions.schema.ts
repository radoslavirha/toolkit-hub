import { z } from 'zod';

import { LogLevel } from '@radoslavirha/logger';
import { SENSITIVE_HEADER_SELECTORS, createRedactionSchema } from '@radoslavirha/redaction';
import type { RedactionFieldOptions } from '@radoslavirha/redaction';

/**
 * Per-source schemas with their default selectors.
 *
 * Only `headers` gets a non-empty default. Header names that carry credentials are
 * fixed by HTTP, so they are knowable here; the sensitive names inside a query string,
 * a request body or a response body are chosen by the application and cannot be guessed
 * — defaulting them would either miss the real field or censor an innocent one.
 *
 * Headers were previously logged verbatim unless a service remembered to configure
 * `redactPaths`, which meant a rejected `Authorization: Bearer …` was written to the log
 * at `error` level on every 401 — and a rejected token is often still a live one. The
 * default closes that without any configuration; a service that wants raw headers back
 * sets `requests.headers.redactPaths: []`.
 */
const RequestFieldSchemas = createRedactionSchema({
    headers: [...SENSITIVE_HEADER_SELECTORS],
    query: [],
    request: [],
    response: []
}).shape;

/**
 * HTTP request/response logging options.
 *
 * Defaulted with `prefault({})`, not `default(...)`: Zod 4's `.default()` short-circuits and
 * returns the literal it was handed without parsing it, so a hand-written default object
 * would have to restate every nested default and would drift from them silently — which is
 * how an omitted `requests` block used to end up with `headers.redactPaths: []`.
 * `prefault({})` runs an empty object through this schema instead, leaving the field
 * declarations below as the single source of truth.
 */
const LoggerRequestOptionsSchema = z.object({
    /** Enable or disable HTTP request/response logging entirely. Default: `true`. */
    enabled: z.boolean().default(true).describe('Write one log entry per handled HTTP request. `false` stops request logging only; application log calls are unaffected.'),
    /**
     * Include raw request headers in the log entry. Default: `true`, with
     * {@link SENSITIVE_HEADER_SELECTORS} redacted unless `redactPaths` is configured.
     */
    headers: RequestFieldSchemas.headers.describe('Request headers, logged as `headers`. Credential headers (`authorization`, `cookie`, `set-cookie`, `proxy-authorization`, `x-api-key`) are redacted by default; a configured `redactPaths` replaces that list, so `[]` logs them raw.'),
    /** Include query-string parameters in the log entry. Default: `true`. */
    query: RequestFieldSchemas.query.describe('Parsed query-string parameters, logged as `query`. The logged `url` never carries the query string.'),
    /** Include the parsed request payload in the log entry. Default: `true`. */
    request: RequestFieldSchemas.request.describe('Request body, logged as `request`. Bodies with a text content type (none, `text/*`, JSON, XML, GraphQL, JavaScript, form-urlencoded, `+json`, `+xml`) are logged; any other body is logged as `[[ BINARY ]]`.'),
    /** Include the endpoint return value (response payload) in the log entry. Default: `true`. */
    response: RequestFieldSchemas.response.describe('Response body, logged as `response`, after the same Ts.ED serialisation the client receives, so `redactPaths` match wire names. A non-text content type is logged as `[[ BINARY ]]`; a body that cannot be serialised, as `[[ UNSERIALIZABLE ]]`.'),
    /** Include the error stack trace in error log entries. Default: `true`. */
    stack: z.boolean().default(true).describe('Add `error_stack` to the entry of a failed request (status 400 or above) when the thrown value is an `Error` or has a string `message`.'),
    /**
     * Request paths to exclude from HTTP request/response logging. Matched against
     * the request pathname (query string stripped) as an anchored prefix: an entry
     * `/health` suppresses `/health`, `/health/live` and `/health/ready`, but not
     * `/healthcheck`. Kubernetes probe endpoints are excluded by default — they run
     * every few seconds for the life of the pod and carry no information.
     */
    ignorePaths: z.array(z.string()).default(['/health', '/healthz']).describe('Request paths that get no log entry. Each is a case-sensitive prefix matched on whole path segments against the path without its query string: `/health` matches `/health` and `/health/live`, not `/healthcheck`. A trailing slash is ignored, so `/` matches every path.')
}).prefault({}).describe('HTTP request logging: one entry per handled request under scope `HTTP_REQUEST`, written when the response finishes, with `reqId`, `method`, `url`, `status` and `duration` (ms). Status below 400 logs `info` "Request completed"; 400 and above logs `error` "Request failed" with the error fields.');

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
    enabled: z.boolean().default(true).describe('Write logs at all. `false` silences every log call, application and HTTP request logs alike.'),
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
 *
 * Aliased from `@radoslavirha/redaction` so inbound request logging shares one
 * configuration vocabulary with every other package that redacts (outbound HTTP,
 * storage, messaging).
 */
export type LoggerRequestFieldOptions = RedactionFieldOptions;
