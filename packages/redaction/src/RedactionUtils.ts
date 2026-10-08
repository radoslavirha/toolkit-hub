import fastRedact from 'fast-redact';
import { CommonUtils, NumberUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';

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
     * @param options `caseInsensitiveRoot` makes root-level selectors match
     *   property names regardless of case (HTTP header names are
     *   case-insensitive), keeping the original spelling in the output.
     *   Nested and wildcard selectors stay exact.
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

        const rootNames = options.caseInsensitiveRoot === true ? RedactionUtils.rootNames(redactPaths) : new Set<string>();

        return (value: unknown): string => {
            const copy = RedactionUtils.toWritableCopy(value);

            RedactionUtils.censorRootNames(copy, rootNames);

            return redactor(copy);
        };
    }

    /** Lowercased property names of the plain (`name`) and bracket (`["name"]`) root-level selectors. */
    private static rootNames(redactPaths: string[]): Set<string> {
        const names = new Set<string>();

        for (const path of redactPaths) {
            const match = /^(?:([A-Za-z_$][\w$]*)|\[(["'])(.+)\2\])$/.exec(path);
            const name = match?.[1] ?? match?.[3];

            if (CommonUtils.notUndefined(name)) {
                names.add(name.toLowerCase());
            }
        }

        return names;
    }

    /** Censors, in place, root properties of a writable copy whose lowercased name is in `names`. */
    private static censorRootNames(copy: unknown, names: Set<string>): void {
        if (names.size === 0 || !ObjectUtils.isObject(copy) || Array.isArray(copy)) {
            return;
        }

        const record = copy as Record<string, unknown>;

        for (const key of Object.keys(record)) {
            if (names.has(key.toLowerCase())) {
                record[key] = RedactionUtils.REDACTED_VALUE;
            }
        }
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
            const parsed = JSON.parse(value.charCodeAt(0) === 0xFEFF ? value.slice(1) : value, RedactionUtils.keepNumberText) as unknown;

            return ObjectUtils.isObject(parsed) ? parsed : value;
        } catch {
            return value;
        }
    }

    /**
     * `JSON.parse` reviver that keeps number literals a double cannot round-trip
     * (large integers, high-precision decimals, out-of-range values) as raw JSON,
     * so re-serialising writes the original text instead of a rounded value or `null`.
     */
    private static keepNumberText(_key: string, value: unknown, context?: { source?: string }): unknown {
        const source = context?.source;

        if (NumberUtils.isNumber(value) && StringUtils.isString(source) && JSON.stringify(value) !== source) {
            return (JSON as unknown as { rawJSON(text: string): unknown }).rawJSON(source);
        }

        return value;
    }
}
