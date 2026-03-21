import winston from 'winston';
import { LogLevel } from './LogLevel.enum.js';
import type { LoggerOptions } from './LoggerOptions.js';

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
        if (optionsOrChild !== undefined && CHILD_LOGGER in optionsOrChild) {
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
     * @param scope - Class or module name to attach as OTEL InstrumentationScope (e.g. "UserService").
     */
    public child<K extends object>(scope: string): Logger<K> {
        const config: ChildConfig = {
            [CHILD_LOGGER]: true,
            enabled: this.enabled,
            logger: this.logger.child({ scope }),
            scope,
            metaProvider: this.metaProvider as (() => Partial<object>) | undefined
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

    private log(level: LogLevel, body: string, meta?: T): void {
        if (!this.enabled) {
            return;
        }

        const baseMeta = this.metaProvider?.();
        const attributes = baseMeta !== undefined || meta !== undefined
            ? { ...baseMeta, ...meta }
            : undefined;

        if (attributes !== undefined) {
            this.logger.log(level, body, { attributes });
        } else {
            this.logger.log(level, body);
        }
    }

    private static buildLogger(options: LoggerOptions): winston.Logger {
        const logger = winston.createLogger({
            levels: WINSTON_LEVELS,
            level: options.logLevel ?? LogLevel.INFO
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
