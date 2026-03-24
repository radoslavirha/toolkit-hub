import { Inject, Injectable, ProviderScope, Scope } from '@tsed/di';
import { $log, BaseAppender, LogEvent, appender } from '@tsed/logger';
import { Logger } from '@radoslavirha/tsed-logger';

const APPENDER_NAME = 'logger-bridge';

type LogMethod = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LEVEL_METHODS: Record<string, LogMethod> = {
    FATAL: 'fatal',
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace',
    ALL: 'debug',
    MARK: 'info',
    OFF: 'debug'
};

interface LoggerLike {
    fatal(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    trace(message: string): void;
}

function buildBridgeAppender(logger: LoggerLike): typeof BaseAppender {
    return class BridgeAppender extends BaseAppender {
        public write(event: LogEvent): void {
            /* v8 ignore next */
            const method: LogMethod = LEVEL_METHODS[event.level.toString()] ?? 'debug';
            const data = event.data as unknown[];
            let message = '';

            if (data.length > 0) {
                message = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
            }

            logger[method](message);
        }
    };
}

/**
 * Configures the Ts.ED global `$log` logger to forward all log events to the
 * provided Logger instance. Safe to call before the DI container is ready.
 *
 * Use this as an escape hatch when you need `$log` bridged before `Platform.bootstrap()`:
 *
 * ```typescript
 * const myLogger = new Logger({ enabled: true, level: LogLevel.DEBUG });
 * configureTsEDLoggerBridge(myLogger);
 * await Platform.bootstrap(Server, configuration);
 * ```
 */
export function configureTsEDLoggerBridge(logger: Logger): void {
    const childLogger = logger.child<object>('TsED');
    const BridgeAppender = buildBridgeAppender(childLogger);

    appender(APPENDER_NAME, BridgeAppender, {});

    $log.level = 'all';
    $log.appenders.clear();
    $log.appenders.set('logger', { type: APPENDER_NAME });
}

/**
 * Ts.ED `$log` bridge service.
 *
 * When registered in the DI container (automatically via `BaseServer`), this singleton
 * replaces Ts.ED's default stdout appender with a forwarding bridge. Every log event
 * produced by the Ts.ED framework is forwarded to the injected `Logger` instance.
 *
 * The injected `Logger` is the DI-managed logger — if the API overrides it with
 * `@OverrideProvider(Logger)`, this bridge automatically uses that override.
 *
 * For pre-DI configuration (capturing bootstrap logs before the container is ready),
 * call the exported {@link configureTsEDLoggerBridge} function directly.
 */
@Injectable()
@Scope(ProviderScope.SINGLETON)
export class TsEDLoggerBridge {
    public constructor(@Inject(Logger) logger: Logger) {
        configureTsEDLoggerBridge(logger);
    }
}
