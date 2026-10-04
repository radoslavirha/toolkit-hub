import winston from 'winston';
import { LogLevel } from './LogLevel.enum.js';
import type { LoggerOptions } from './LoggerOptions.js';
import { LogErrorUtils } from './LogErrorUtils.js';
import { CommonUtils } from '@radoslavirha/utils';

/** Winston custom levels — lower number = higher priority (matches OTEL severity order). */
const WINSTON_LEVELS: Record<LogLevel, number> = {
    [LogLevel.FATAL]: 0,
    [LogLevel.ERROR]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 3,
    [LogLevel.DEBUG]: 4,
    [LogLevel.TRACE]: 5
};

/** Winston npm-style colours for each custom level. */
const WINSTON_COLORS: Record<LogLevel, string> = {
    [LogLevel.FATAL]: 'bold red',
    [LogLevel.ERROR]: 'red',
    [LogLevel.WARN]: 'yellow',
    [LogLevel.INFO]: 'green',
    [LogLevel.DEBUG]: 'blue',
    [LogLevel.TRACE]: 'grey'
};

/** Fields the logger sets itself; a metadata key with one of these names is emitted as `meta_<key>`. */
const RESERVED_KEYS: readonly string[] = ['timestamp', 'level', 'message', 'scope'];

/**
 * Unique symbol used as a brand key on {@link ChildConfig}.
 * Not exported — external code cannot construct a valid ChildConfig.
 */
const CHILD_LOGGER: unique symbol = Symbol('Logger.child');

/** Internal config used exclusively by the child constructor overload. */
interface ChildConfig {
    readonly [CHILD_LOGGER]: true;
    readonly enabled: boolean;
    readonly logger: winston.Logger;
    readonly scope: string;
    readonly metaProvider?: () => Partial<object>;
}

/**
 * Structured logger backed by Winston.
 *
 * Produces one JSON line per call. Use {@link child} to create a scoped child
 * logger with the `scope` field pinned on every log line.
 *
 * @example
 * ```typescript
 * const logger = new Logger();
 * const log = logger.child('UserService');
 * log.info('User created', { userId: 'abc' });
 * ```
 */
export class Logger<T extends object = object> {
    private readonly logger: winston.Logger;
    private readonly enabled: boolean;
    private readonly metaProvider?: () => Partial<T>;

    public constructor(options?: LoggerOptions<T>);
    public constructor(childConfig: ChildConfig);
    constructor(optionsOrChild?: LoggerOptions<T> | ChildConfig) {
        if (CommonUtils.notUndefined(optionsOrChild) && CHILD_LOGGER in optionsOrChild) {
            this.enabled = optionsOrChild.enabled;
            this.logger = optionsOrChild.logger;
            this.metaProvider = optionsOrChild.metaProvider as (() => Partial<T>) | undefined;
        } else {
            this.enabled = optionsOrChild?.enabled ?? true;
            this.logger = Logger.buildLogger(optionsOrChild ?? {});
            this.metaProvider = optionsOrChild?.metaProvider;
        }
    }

    /**
     * Creates a child logger with the `scope` field pinned on every log line.
     * Child loggers share the same Winston transport as the parent.
     *
    * An optional `metaProvider` can be supplied to add or override base metadata fields
     * specific to this child scope. When both parent and child define a `metaProvider`,
     * their results are merged on every log call — child properties take precedence
     * over parent properties with the same key.
     *
     * @param scope - Class or module name to attach as OTEL InstrumentationScope (e.g. "UserService").
     * @param options - Optional per-child configuration.
    * @param options.metaProvider - Callback invoked on every log call to supply child-scoped
    *   base metadata fields. Merged on top of the parent provider; child keys win on conflict.
     */
    public child<K extends object>(scope: string, options?: { readonly metaProvider?: () => Partial<K> }): Logger<K> {
        const parentProvider = this.metaProvider as (() => Partial<object>) | undefined;
        const childProvider = options?.metaProvider as (() => Partial<object>) | undefined;

        let mergedProvider: (() => Partial<object>) | undefined;
        if (CommonUtils.notUndefined(parentProvider) && CommonUtils.notUndefined(childProvider)) {
            mergedProvider = () => ({ ...parentProvider(), ...childProvider() });
        } else {
            mergedProvider = childProvider ?? parentProvider;
        }

        const config: ChildConfig = {
            [CHILD_LOGGER]: true,
            enabled: this.enabled,
            logger: this.logger.child({ scope }),
            scope,
            metaProvider: mergedProvider
        };
        return new Logger<K>(config);
    }

    /** Log at FATAL level (OTEL severityNumber 21). */
    public fatal(body: string, meta?: T): void {
        this.log(LogLevel.FATAL, body, meta);
    }

    /** Log at ERROR level (OTEL severityNumber 17). */
    public error(body: string, meta?: T): void {
        this.log(LogLevel.ERROR, body, meta);
    }

    /** Log at WARN level (OTEL severityNumber 13). */
    public warn(body: string, meta?: T): void {
        this.log(LogLevel.WARN, body, meta);
    }

    /** Log at INFO level (OTEL severityNumber 9). */
    public info(body: string, meta?: T): void {
        this.log(LogLevel.INFO, body, meta);
    }

    /** Log at DEBUG level (OTEL severityNumber 5). */
    public debug(body: string, meta?: T): void {
        this.log(LogLevel.DEBUG, body, meta);
    }

    /** Log at TRACE level (OTEL severityNumber 1). */
    public trace(body: string, meta?: T): void {
        this.log(LogLevel.TRACE, body, meta);
    }

    public log(level: LogLevel, body: string, meta?: T): void {
        if (!this.enabled) {
            return;
        }

        const baseMeta = this.metaProvider?.();
        const metadata = { ...baseMeta, ...Logger.serializeMeta(meta) };

        // Single-object form: the (level, msg, meta) form appends `meta.message` to the body.
        this.logger.log({ ...Logger.renameReservedKeys(metadata), level, message: body });
    }

    /**
     * Moves metadata keys that clash with system fields to `meta_<key>`, so the system
     * value (`timestamp`, `level`, `message`, pinned `scope`) always wins and the caller's
     * value is kept.
     */
    private static renameReservedKeys(metadata: object): object {
        if (!RESERVED_KEYS.some((key) => key in metadata)) {
            return metadata;
        }
        return Object.fromEntries(
            Object.entries(metadata).map(([key, value]) => [RESERVED_KEYS.includes(key) ? `meta_${ key }` : key, value])
        );
    }

    /**
     * Makes `Error` instances survive the object spread and JSON serialisation.
     * A top-level `Error` becomes `error_name` / `error_message` / `error_stack` fields;
     * an `Error` value one level down becomes `{ name, message, stack }`.
     */
    private static serializeMeta(meta?: object): object | undefined {
        if (meta instanceof Error) {
            return { ...meta, ...LogErrorUtils.toFields(meta) };
        }
        if (CommonUtils.isUndefined(meta) || !Object.values(meta).some((value) => value instanceof Error)) {
            return meta;
        }
        return Object.fromEntries(
            Object.entries(meta).map(([key, value]) => [
                key,
                value instanceof Error ? { ...value, name: value.name, message: value.message, stack: value.stack } : value
            ])
        );
    }

    private static buildLogger(options: LoggerOptions): winston.Logger {
        const logger = winston.createLogger({
            levels: WINSTON_LEVELS,
            level: options.level ?? LogLevel.INFO
        });

        winston.addColors(WINSTON_COLORS);

        logger.add(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format((info) => {
                        const {
                            timestamp, level, message, ...rest
                        } = info;
                        return {
                            timestamp, level, message, ...rest
                        };
                    })(),
                    winston.format.json({ deterministic: false })
                ),
                stderrLevels: [LogLevel.ERROR, LogLevel.FATAL]
            })
        );

        return logger;
    }
}
