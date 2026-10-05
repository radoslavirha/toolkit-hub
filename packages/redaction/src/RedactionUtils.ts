import fastRedact from 'fast-redact';
import { ArrayUtils, CommonUtils, NumberUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';

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
     * Values are always redacted on a JSON copy, never on the input itself:
     * `fast-redact` censors by assigning in place, which frozen objects,
     * non-writable and getter-only properties silently ignore, and a `toJSON()`
     * method would serialise a different object than the one censored. The
     * copy has exactly the shape the serialiser emits, so every enabled field
     * in it is redacted. The input is never modified.
     *
     * A string input that parses as a JSON object or array is redacted as that
     * value and re-serialised compactly. Any other string — plain text, a raw
     * query string, a JSON primitive — cannot be addressed by path selectors and
     * is returned unchanged; parse such payloads before redacting them.
     *
     * @param redactPaths Selectors to censor. An empty list yields a redactor
     *   that only serialises.
     * @param options `caseInsensitiveRoot` makes root-level selectors (`authorization`,
     *   `["x-api-key"]`) match property names regardless of case, keeping the original
     *   spelling in the output — for HTTP header names (RFC 9110 §5.1). Nested and
     *   wildcard selectors stay exact.
     */
    public static compileRedactor(redactPaths: string[], options: { caseInsensitiveRoot?: boolean } = {}): RedactorFunction {
        const redactor = fastRedact({
            paths: redactPaths,
            censor: RedactionUtils.REDACTED_VALUE,
            serialize: RedactionUtils.stringifyForLog,
            strict: false
        }) as RedactorFunction;

        if (redactPaths.length === 0) {
            return redactor;
        }

        const rootNames = options.caseInsensitiveRoot === true ? RedactionUtils.rootNames(redactPaths) : undefined;

        return (value: unknown): string => {
            const copy = RedactionUtils.toWritableCopy(value);

            if (CommonUtils.notUndefined(rootNames) && rootNames.size > 0 && ObjectUtils.isObject(copy) && !ArrayUtils.isArray(copy)) {
                const record = copy as Record<string, unknown>;

                for (const key of Object.keys(record)) {
                    if (rootNames.has(key.toLowerCase())) {
                        record[key] = RedactionUtils.REDACTED_VALUE;
                    }
                }
            }

            return redactor(copy);
        };
    }

    /** Lowercased property names of the root-level selectors (`name`, `["name"]`, `['name']`). */
    private static rootNames(redactPaths: string[]): Set<string> {
        const names = new Set<string>();

        for (const path of redactPaths) {
            const match = /^([A-Za-z_$][\w$]*)$|^\[(["'])([^"'\\]+)\2\]$/.exec(path);
            const name = match?.[1] ?? match?.[3];

            if (CommonUtils.notUndefined(name)) {
                names.add(name.toLowerCase());
            }
        }

        return names;
    }

    /**
     * A writable copy with the shape the serialiser would emit. Returns the
     * value itself when it has no JSON form, so it serialises as before. A
     * string holding a JSON object or array is parsed, so its paths can be
     * redacted; any other string is returned as is.
     */
    private static toWritableCopy(value: unknown): unknown {
        if (StringUtils.isString(value)) {
            return RedactionUtils.parseJsonContainer(value);
        }

        try {
            const serialized = JSON.stringify(value);

            return StringUtils.isString(serialized) ? JSON.parse(serialized) as unknown : value;
        } catch {
            return value;
        }
    }

    /**
     * The parsed value when `value` is JSON text for an object or array, else `value` itself.
     * A leading byte order mark is not part of the JSON value (RFC 8259 §8.1), so it is ignored.
     */
    private static parseJsonContainer(value: string): unknown {
        try {
            const parsed = JSON.parse(value.charCodeAt(0) === 0xFEFF ? value.slice(1) : value, RedactionUtils.keepUnsafeIntegers) as unknown;

            return ObjectUtils.isObject(parsed) ? parsed : value;
        } catch {
            return value;
        }
    }

    /**
     * `JSON.parse` reviver that keeps integer literals a double cannot hold
     * exactly (above `Number.MAX_SAFE_INTEGER`) as raw JSON, so re-serialising
     * writes the original digits instead of a rounded value.
     */
    private static keepUnsafeIntegers(_key: string, value: unknown, context?: { source?: string }): unknown {
        const source = context?.source;

        if (NumberUtils.isNumber(value) && StringUtils.isString(source) && /^-?\d+$/.test(source) && !Number.isSafeInteger(value)) {
            return (JSON as unknown as { rawJSON(text: string): unknown }).rawJSON(source);
        }

        return value;
    }
}
