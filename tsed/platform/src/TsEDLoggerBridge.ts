import { Inject, Injectable, ProviderScope, Scope } from '@tsed/di';
import { $log } from '@tsed/logger';
import { BaseLogger, Logger, LogLevel } from '@radoslavirha/tsed-logger';
import '@tsed/logger-connect';
import { ArrayUtils, CommonUtils } from '@radoslavirha/utils';

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

    /* v8 ignore start */
    private processLogEvent(level: LogLevel, event: Record<string, unknown>): void {
        let message: string;

        // Ts.ED logs are absolutely crazy and not standardised. Sometimes 'message' is in message property, sometimes in event property, sometimes in data array.
        const eventMessage = this.parseTsEDEvent(event);

        if (event.message) {
            message = this.sanitizeString(event.message as string);
        } else if (eventMessage) {
            message = this.sanitizeString(eventMessage);
        } else {
            message = 'Ts.ED Log Event';
        }

        if (ArrayUtils.isArray(event.data) && event.data.length > 0) {
            message = (event.data as string[])
                .map((item) => this.sanitizeString(item))
                .join(' ');
        }
        this.logger.log(level, message);
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

    private sanitizeString(str: string): string {
        return str.replace(/\x1B(?:\[[0-9;]*[A-Za-z])?/g, '').trim();
    }
    /* v8 ignore stop */
}
