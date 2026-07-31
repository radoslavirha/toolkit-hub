import fastRedact from 'fast-redact';

/** Function that serializes a value into a (possibly redacted) log-safe string. */
export type RedactorFunction = (value: unknown) => string;

/**
 * Utility class for redacting sensitive fields from logged request/response payloads.
 */
export class RedactionUtils {
    private static readonly REDACTED_VALUE = '***';

    /**
     * Serializes a value for logging.
     * @param value The value to serialize.
     * @returns The serialized value: strings are returned unchanged, `undefined` becomes
     *   the literal string `'undefined'`, everything else is `JSON.stringify`-ed, falling
     *   back to `String(value)` when serialization yields `undefined` (e.g. symbols), or
     *   `[[ UNSERIALIZABLE ]]` when serialization throws (e.g. circular references).
     */
    public static stringifyForLog(value: unknown): string {
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

    /**
     * Compiles a list of `fast-redact` path selectors into a reusable redactor function.
     * @param redactPaths The `fast-redact` path selectors to redact (e.g. `user.password`, `items.*.token`).
     * @returns A function that serializes its input via {@link RedactionUtils.stringifyForLog} while
     *   replacing any values matched by `redactPaths` with `'***'`.
     */
    public static compileRedactor(redactPaths: string[]): RedactorFunction {
        return fastRedact({
            paths: redactPaths,
            censor: RedactionUtils.REDACTED_VALUE,
            serialize: RedactionUtils.stringifyForLog,
            strict: false
        }) as RedactorFunction;
    }
}

