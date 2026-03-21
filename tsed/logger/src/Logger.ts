import { Injectable, Scope } from '@tsed/di';
import { ProviderScope } from '@tsed/di';
import { Logger as BaseLogger } from '@radoslavirha/logger';
import type { LoggerOptions } from '@radoslavirha/logger';

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
 * import { Injectable, OverrideProvider, Scope } from '@tsed/di';
 * import { ProviderScope } from '@tsed/di';
 * import { Logger } from '@radoslavirha/tsed-logger';
 *
 * \@Injectable()
 * \@OverrideProvider(Logger)
 * \@Scope(ProviderScope.SINGLETON)
 * export class LoggerService extends Logger {
 *   constructor(readonly configService: ConfigService) {
 *     super(configService.config.logger);
 *   }
 * }
 * ```
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
    public constructor(options: LoggerOptions) {
        super(options);
    }
}
