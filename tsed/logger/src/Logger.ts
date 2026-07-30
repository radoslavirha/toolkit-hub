import { Injectable, ProviderScope, Scope } from '@tsed/di';
import { PlatformContext } from '@tsed/platform-http';
import { Logger as BaseLogger } from '@radoslavirha/logger';
import { ObjectUtils } from '@radoslavirha/utils';

import { LoggerOptionsDefaults, type LoggerOptions } from './RequestLogOptions.schema.js';

/**
 * Ts.ED injectable singleton logger.
 *
 * Extends {@link BaseLogger} from `@radoslavirha/logger` with Ts.ED DI support.
 * Inject into any service or controller and call `.child('MyClass')` to pin `scope`
 * on every log line emitted from that class.
 *
 * `Logger` is the shared DI token across all packages. The API overrides it using
 * `@OverrideProvider` so every injectable — including shared library packages —
 * receives the single API-configured instance.
 *
 * ## API-side setup
 *
 * In the API, create a `LoggerService` that extends `Logger` and reads options
 * from `ConfigService`. Decorate it with `@OverrideProvider(Logger)` so the DI
 * container substitutes it everywhere `Logger` is injected:
 *
 * ```typescript
 * // API — LoggerService.ts
 * import { OverrideProvider } from '@tsed/di';
 * import { Logger } from '@radoslavirha/tsed-logger';
 *
 * \@OverrideProvider(Logger)
 * export class LoggerService extends Logger {
 *   constructor(readonly configService: ConfigService) {
 *     // metaProvider is passed as the second argument; options come from JSON config
 *     super(configService.config.logger, () => ({ requestId: getRequestId() }));
 *   }
 * }
 * ```
 *
 * Do not also decorate `LoggerService` with `@Injectable()`: `@OverrideProvider(Logger)`
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
export class Logger<T extends object = object> extends BaseLogger<T> {
    private readonly httpLog: BaseLogger;
    private readonly options: LoggerOptions;

    /**
     * @param options - Logger configuration, already parsed and defaulted via
     *   {@link LoggerOptionsSchema}. APIs should call `LoggerOptionsSchema.parse(rawConfig)`
     *   when loading JSON configuration, then pass the result here.
     * @param metaProvider - Optional callback invoked on every log call to
     *   supply base attributes (e.g. request-id, trace-id).  Not serialisable,
     *   so it must be passed here rather than included in `options`.
     */
    public constructor(options: LoggerOptions = LoggerOptionsDefaults, metaProvider?: () => Partial<T>) {
        const resolved: LoggerOptions = options;
        super({
            enabled: resolved.enabled,
            level: resolved.level,
            metaProvider
        });
        this.httpLog = this.child('HTTP_REQUEST');
        this.options = resolved;
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

        if (ObjectUtils.isEnabled(this.options.requests.headers)) {
            meta.headers = Logger.stringifyForLog($ctx.request.headers);
        }

        if (ObjectUtils.isEnabled(this.options.requests.query)) {
            meta.query = Logger.stringifyForLog($ctx.request.query);
        }

        if (ObjectUtils.isEnabled(this.options.requests.request)) {
            meta.request = Logger.stringifyForLog($ctx.request.body);
        }

        if (ObjectUtils.isEnabled(this.options.requests.response)) {
            const contentType = String($ctx.response.getHeaders()['content-type'] ?? '');
            const isTextSafe = !contentType || /^(text\/|application\/(json|xml|ld\+json|graphql|javascript|x-www-form-urlencoded))/i.test(contentType);
            meta.response = isTextSafe ? Logger.stringifyForLog($ctx.data) : '[[ BINARY ]]';
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

    private static stringifyForLog(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'undefined') {
            return 'undefined';
        }

        try {
            const serialized = JSON.stringify(value);
            if (typeof serialized === 'string') {
                return serialized;
            }
        } catch {
            return '[[ UNSERIALIZABLE ]]';
        }

        return String(value);
    }
}
