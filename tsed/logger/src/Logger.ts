import { Injectable, ProviderScope, Scope } from '@tsed/di';
import { PlatformContext } from '@tsed/platform-http';
import { Logger as BaseLogger, LogErrorUtils } from '@radoslavirha/logger';
import { CommonUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';

import { RedactionProfile, RedactionUtils } from '@radoslavirha/redaction';

import { LoggerOptionsInput, LoggerOptionsSchema, type LoggerOptions } from './RequestLogOptions.schema.js';
import { LoggerMetadata } from './LoggerMetadata.js';

type RequestLogSource = 'headers' | 'query' | 'request' | 'response';

/**
 * Ts.ED injectable singleton logger.
 *
 * Extends {@link BaseLogger} from `@radoslavirha/logger` with Ts.ED DI support.
 * Inject into any service or controller and call `.child('MyClass')` to pin `scope`
 * on every log line emitted from that class.
 *
 * `Logger` is the shared DI token across all packages. The API overrides it using
 * `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` so every injectable — including shared library packages —
 * receives the single API-configured instance.
 *
 * ## API-side setup
 *
 * In the API, create a `LoggerService` that extends `Logger` and reads options
 * from `ConfigService`. Decorate it with `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` so the DI
 * container substitutes it everywhere `Logger` is injected:
 *
 * ```typescript
 * // API — LoggerService.ts
 * import { Logger } from '@radoslavirha/tsed-logger';
 *
 * \@Injectable({token: Logger, scope: ProviderScope.SINGLETON})
 * export class LoggerService extends Logger {
 *   constructor(readonly configService: ConfigService) {
 *     // metaProvider is passed as the second argument; options come from JSON config
 *     super(configService.config.logger, () => ({ requestId: getRequestId() }));
 *   }
 * }
 * ```
 *
 * Do not also decorate `LoggerService` with `@Injectable()`: `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})`
 * already replaces the Logger provider token, and registering the override as a second
 * injectable provider registers lifecycle hooks twice.
 *
 * ## Shared library packages
 *
 * Any `@Injectable` in any package just injects `Logger` and calls `.child()`:
 *
 * ```typescript
 * \@Injectable()
 * export class SomeService {
 *   private readonly log: Logger;
 *
 *   constructor(logger: Logger) {
 *     this.log = logger.child('SomeService');
 *   }
 * }
 * ```
 */
@Injectable()
@Scope(ProviderScope.SINGLETON)
export class Logger extends BaseLogger<LoggerMetadata> {
    private readonly httpLog: BaseLogger;
    private readonly options: LoggerOptions;
    private readonly redaction: RedactionProfile<RequestLogSource>;
    private readonly ignorePaths: readonly string[];

    /**
     * @param options - Logger configuration, already parsed and defaulted via
     *   {@link LoggerOptionsSchema}. APIs should call `LoggerOptionsSchema.parse(rawConfig)`
     *   when loading JSON configuration, then pass the result here.
     * @param metaProvider - Optional callback invoked on every log call to
     *   supply base attributes (e.g. request-id, trace-id).  Not serialisable,
     *   so it must be passed here rather than included in `options`.
     */
    public constructor(options: LoggerOptionsInput = {}, metaProvider?: () => Partial<LoggerMetadata>) {
        const resolved: LoggerOptions = LoggerOptionsSchema.parse(options);
        super({
            enabled: resolved.enabled,
            level: resolved.level,
            metaProvider
        });
        this.httpLog = this.child('HTTP_REQUEST');
        this.options = resolved;
        // Compiled once here — never per request.
        this.redaction = new RedactionProfile<RequestLogSource>({
            headers: resolved.requests.headers,
            query: resolved.requests.query,
            request: resolved.requests.request,
            response: resolved.requests.response
        });
        // Resolved once here — never per request.
        this.ignorePaths = resolved.requests.ignorePaths;
    }

    /**
     * Anchored, case-sensitive prefix match on a path-segment boundary: `/health`
     * matches `/health` and `/health/live`, but not `/healthchecks-admin`.
     * The query string is stripped before matching.
     */
    private isIgnoredPath(url: string): boolean {
        if (this.ignorePaths.length === 0) {
            return false;
        }

        const path = url.split('?')[0] as string;

        return this.ignorePaths.some((entry) => path === entry || path.startsWith(`${entry}/`));
    }

    /**
     * A `Buffer` / `Uint8Array` body would serialise as `{"type":"Buffer","data":[…]}`, which hides
     * the payload's keys from `redactPaths`. Decode it to UTF-8 so JSON text is redacted like any other.
     */
    private static decodeBinary(body: unknown): unknown {
        return body instanceof Uint8Array ? Buffer.from(body).toString('utf8') : body;
    }

    /**
     * `$ctx.error` is whatever the handler threw, unwrapped — not necessarily an `Error`.
     * Error-like values keep `name` / `message` / `stack`; anything else (a string, a plain
     * object without `message`) is stringified into `error_message` so the failure isn't lost.
     */
    private errorFields(error: unknown): Record<string, unknown> {
        if (CommonUtils.isNil(error)) {
            return {};
        }

        if (error instanceof Error || StringUtils.isString((error as { message?: unknown }).message)) {
            return { ...LogErrorUtils.toFields(error as Error & { code?: string }, { stack: this.options.requests.stack }) };
        }

        return { error_message: RedactionUtils.stringifyForLog(error) };
    }

    private $onResponse($ctx: PlatformContext): void {
        if (!ObjectUtils.isEnabled(this.options.requests)) {
            return;
        }

        if (this.isIgnoredPath($ctx.request.url)) {
            return;
        }

        const status = $ctx.response.statusCode as number;
        const duration = Date.now() - $ctx.dateStart.getTime();
        const meta: Record<string, unknown> = {
            reqId: $ctx.id,
            method: $ctx.request.method,
            url: ($ctx.request.url).split('?')[0],
            status,
            duration
        };

        const mediaType = String($ctx.response.getHeaders()['content-type'] ?? '').split(';')[0]!.trim();
        // Structured-syntax suffixes (RFC 6839): application/problem+json, application/vnd.api+json, …
        const isTextSafe = !mediaType || /^(text\/|application\/(json|xml|graphql|javascript|x-www-form-urlencoded)$|application\/[\w.+-]+\+(json|xml)$)/i.test(mediaType);

        Object.assign(meta, this.redaction.collect({
            headers: $ctx.request.headers,
            query: $ctx.request.query,
            request: Logger.decodeBinary($ctx.request.body),
            ...(isTextSafe ? { response: Logger.decodeBinary($ctx.data) } : {})
        }));

        if (!isTextSafe && this.redaction.isEnabled('response')) {
            meta.response = '[[ BINARY ]]';
        }

        if (status >= 400) {
            this.httpLog.error('Request failed', {
                ...meta,
                ...this.errorFields($ctx.error)
            });
        } else {
            this.httpLog.info('Request completed', meta);
        }
    }
}
