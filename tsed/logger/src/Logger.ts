import { Injectable, ProviderScope, Scope } from '@tsed/di';
import { PlatformContext } from '@tsed/platform-http';
import { Logger as BaseLogger } from '@radoslavirha/logger';
import { ObjectUtils } from '@radoslavirha/utils';

import { RedactionProfile } from '@radoslavirha/redaction';

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
    }

    private $onResponse($ctx: PlatformContext): void {
        if (!ObjectUtils.isEnabled(this.options.requests)) {
            return;
        }

        const status = $ctx.response.statusCode as number;
        const duration = Date.now() - $ctx.dateStart.getTime();
        const meta: Record<string, unknown> = {
            reqId: $ctx.id,
            method: $ctx.request.method,
            url: $ctx.request.url,
            status,
            duration
        };

        const contentType = String($ctx.response.getHeaders()['content-type'] ?? '');
        const isTextSafe = !contentType || /^(text\/|application\/(json|xml|ld\+json|graphql|javascript|x-www-form-urlencoded))/i.test(contentType);

        Object.assign(meta, this.redaction.collect({
            headers: $ctx.request.headers,
            query: $ctx.request.query,
            request: $ctx.request.body,
            ...(isTextSafe ? { response: $ctx.data } : {})
        }));

        if (!isTextSafe && this.redaction.isEnabled('response')) {
            meta.response = '[[ BINARY ]]';
        }

        if (status >= 400) {
            const error = $ctx.error as (Error & { code?: string; errors?: unknown[]; body?: unknown; headers?: unknown }) | undefined;

            this.httpLog.error('Request failed', {
                ...meta,
                ...(error
                    ? {
                        error_name: error.name ?? error.code,
                        error_message: error.message,
                        ...(this.options.requests.stack ? { error_stack: error.stack } : {})
                    }
                    : {})
            });
        } else {
            this.httpLog.info('Request completed', meta);
        }
    }
}
