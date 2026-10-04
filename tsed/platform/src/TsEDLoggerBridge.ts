import { Inject, Injectable, ProviderScope, Scope } from '@tsed/di';
import { $log, layout, LogEvent, logEventToObject } from '@tsed/logger';
import { BaseLogger, Logger, LogLevel } from '@radoslavirha/tsed-logger';
import '@tsed/logger-connect';
import { ArrayUtils, CommonUtils, StringUtils } from '@radoslavirha/utils';

const LAYOUT_NAME = 'radoslavirha-tsed-logger-bridge';

/**
 * Ts.ED's default `object` layout `Object.assign`s every object argument onto the log object and keeps only
 * non-object arguments in `data`. `Error#message` and `Error#stack` are non-enumerable, so an `Error` passed as
 * `logger.error('msg', error)` disappeared. This layout keeps `Error` arguments in `data`, in their original position.
 * An object is only treated as the log record when it is the sole argument (`logger.warn({ event, message, error })`);
 * its nested `Error`s are kept in `data`. Objects and arrays passed alongside other arguments are context and are
 * kept in `data` too, instead of being merged onto the log where nothing reads them.
 */
class TsEDLoggerBridgeLayout {
    public transform(loggingEvent: LogEvent): Record<string, unknown> {
        const args = loggingEvent.data as unknown[];
        const data = args.reduce<unknown[]>((acc, current) => {
            if (current instanceof Error || ArrayUtils.isArray(current)) {
                return [...acc, current];
            }
            if (typeof current === 'object' && args.length > 1) {
                return [...acc, current];
            }
            // Mirrors `logEventToObject`: the record is already merged onto the log, only its nested `data` is kept.
            if (typeof current === 'object') {
                const record = (current ?? {}) as Record<string, unknown>;
                const errors = Object.values(record).filter((value) => value instanceof Error);
                return acc.concat(record.data ?? [], errors);
            }
            return [...acc, current];
        }, []);

        return { ...logEventToObject(loggingEvent), data };
    }
}

layout(LAYOUT_NAME, TsEDLoggerBridgeLayout);

@Injectable()
@Scope(ProviderScope.SINGLETON)
export class TsEDLoggerBridge {
    private readonly logger: BaseLogger;

    constructor(@Inject(Logger) logger: Logger) {
        this.logger = logger.child('TSED');
    }

    public getTsEDLoggerConfig(settings?: TsED.LoggerConfiguration): TsED.LoggerConfiguration {
        $log.appenders.clear();
        $log.appenders.set('logger', {
            type: 'connect',
            layout: { type: LAYOUT_NAME },
            options: {
                logger: {
                    /* v8 ignore start */
                    trace: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.TRACE, obj),
                    debug: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.DEBUG, obj),
                    info: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.INFO, obj),
                    warn: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.WARN, obj),
                    error: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.ERROR, obj),
                    fatal: (obj: Record<string, unknown>) => this.processLogEvent(LogLevel.FATAL, obj)
                    /* v8 ignore stop */
                }
            }
        });

        return {
            level: 'debug',
            ...settings ?? {}
        };
    }

    private processLogEvent(level: LogLevel, event: Record<string, unknown>): void {
        // Ts.ED logs are absolutely crazy and not standardised. Sometimes 'message' is in message property, sometimes in event property, sometimes in data array.
        const eventMessage = this.parseTsEDEvent(event);
        const parts: unknown[] = [];

        if (event.message) {
            parts.push(event.message);
        } else if (eventMessage) {
            parts.push(eventMessage);
        }

        if (ArrayUtils.isArray(event.data)) {
            parts.push(...event.data);
        }

        const message = parts
            .map((item) => this.sanitizeString(item))
            .join(' ');

        this.logger.log(level, message || 'Ts.ED Log Event');
    }

    private parseTsEDEvent(event: Record<string, unknown>): string | undefined {
        if (CommonUtils.isNil(event.event)) {
            return;
        }

        switch (event.event) {
            case 'request.end':
                return `Request finished in ${event.duration}ms`;
            default:
                return event.event as string;
        }
    }

    private stringify(value: unknown): string {
        if (value instanceof Error) {
            return value.stack ?? value.message;
        }
        if (StringUtils.isString(value)) {
            return value;
        }
        try {
            return JSON.stringify(value, (_key, nested: unknown) => nested instanceof Error ? nested.stack ?? nested.message : nested) ?? String(value);
        } catch {
            return String(value);
        }
    }

    private sanitizeString(value: unknown): string {
        return this.stringify(value).replace(/\x1B(?:\[[0-9;]*[A-Za-z])?/g, '').trim();
    }
}
