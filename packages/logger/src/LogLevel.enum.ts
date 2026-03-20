/**
 * OTEL-aligned log severity levels.
 *
 * Maps directly to OpenTelemetry SeverityText values.
 * @see https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitytext
 */
export enum LogLevel {
    FATAL = 'fatal',
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
}
