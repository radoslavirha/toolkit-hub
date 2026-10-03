import fastRedact from 'fast-redact';
import { CommonUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';

/** A compiled redactor: serialises its input, censoring any configured paths. */
export type RedactorFunction = (value: unknown) => string;

/**
 * Low-level redaction primitives.
 *
 * `fast-redact` builds its redactor with `new Function`, which is expensive.
 * {@link compileRedactor} must therefore be called **once per configuration**
 * (at construction time) and the returned function reused for every value —
 * never per log call. {@link RedactionProfile} does this for you.
 */
export class RedactionUtils {
    /** Replacement written in place of a redacted value. */
    public static readonly REDACTED_VALUE = '***';

    /**
     * Serialises a value for logging.
     *
     * @returns Strings unchanged, `undefined` as the literal `'undefined'`, and
     *   everything else JSON-stringified — falling back to `String(value)` when
     *   serialisation yields `undefined` (e.g. symbols), or
     *   `[[ UNSERIALIZABLE ]]` when it throws (e.g. circular references).
     */
    public static stringifyForLog(value: unknown): string {
        if (StringUtils.isString(value)) {
            return value;
        }

        if (CommonUtils.isUndefined(value)) {
            return 'undefined';
        }

        try {
            const serialized = JSON.stringify(value);

            if (StringUtils.isString(serialized)) {
                return serialized;
            }
        } catch {
            return '[[ UNSERIALIZABLE ]]';
        }

        return String(value);
    }

    /**
     * Compiles path selectors into a reusable redactor. **Expensive — call once
     * and cache the result.**
     *
     * Selector semantics:
     * - `authorization` → a root-level property
     * - `user.password` → an exact nested path
     * - `items.*.token` → wildcard paths
     * - `["set-cookie"]` → bracket notation, **required** for names containing
     *   characters that are not valid identifiers (e.g. a hyphen)
     *
     * Frozen input is redacted too: `fast-redact` censors by assigning in place,
     * which a frozen object silently ignores, so a value containing a frozen
     * object is redacted on a JSON copy instead. The input is never modified.
     *
     * @param redactPaths Selectors to censor. An empty list yields a redactor
     *   that only serialises.
     */
    public static compileRedactor(redactPaths: string[]): RedactorFunction {
        const redactor = fastRedact({
            paths: redactPaths,
            censor: RedactionUtils.REDACTED_VALUE,
            serialize: RedactionUtils.stringifyForLog,
            strict: false
        }) as RedactorFunction;

        if (redactPaths.length === 0) {
            return redactor;
        }

        return (value: unknown): string => redactor(
            RedactionUtils.containsFrozen(value, new Set()) ? RedactionUtils.toWritableCopy(value) : value
        );
    }

    private static containsFrozen(value: unknown, seen: Set<object>): boolean {
        if (!ObjectUtils.isObject(value) || seen.has(value)) {
            return false;
        }

        if (Object.isFrozen(value)) {
            return true;
        }

        seen.add(value);

        return Object.values(value).some((child) => RedactionUtils.containsFrozen(child, seen));
    }

    /**
     * A writable copy with the shape the serialiser would emit. Returns the
     * value itself when it has no JSON form, so it serialises as before.
     */
    private static toWritableCopy(value: unknown): unknown {
        try {
            const serialized = JSON.stringify(value);

            return StringUtils.isString(serialized) ? JSON.parse(serialized) as unknown : value;
        } catch {
            return value;
        }
    }
}
