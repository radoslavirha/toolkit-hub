import { z } from 'zod';

/** A single `fast-redact` path selector. */
export const RedactionSelectorSchema = z.string().trim().min(1);

/**
 * Header names that carry a credential often enough that logging them verbatim is a
 * defect rather than a decision.
 *
 * Header names are the one category of sensitive field that is knowable in advance:
 * they are fixed by HTTP and by near-universal convention, not by the application.
 * Body and query field names are application-specific, which is why nothing in this
 * package guesses at those.
 *
 * - `authorization` — bearer/basic credentials. A *rejected* token is frequently still
 *   a live one (minted for another audience, expired by seconds, valid against another
 *   API), so a 401 is not a reason to log it.
 * - `cookie` — session identifiers arriving on a request.
 * - `["set-cookie"]` — the same identifiers on the way back out.
 * - `["proxy-authorization"]` — RFC 9110 credentials for an intermediary.
 * - `["x-api-key"]` — not standardised, but the de facto name for a raw API key.
 *
 * The bracket form is **required** for names that are not valid identifiers (anything
 * with a hyphen); `fast-redact` throws on `set-cookie` written bare.
 *
 * Speculative vendor-specific headers are deliberately absent: a selector that never
 * matches buys nothing and makes the list read as more complete than it is. Challenge
 * headers (`www-authenticate`) are absent too — they carry no secret.
 */
export const SENSITIVE_HEADER_SELECTORS = [
    'authorization',
    'cookie',
    '["set-cookie"]',
    '["proxy-authorization"]',
    '["x-api-key"]'
] as const;

/**
 * Per-field redaction options — the shared configuration vocabulary for every
 * package that redacts before logging.
 *
 * `enabled: false` means the field is omitted from the output entirely, not that
 * it is logged unredacted.
 */
export const RedactionFieldOptionsSchema = z.object({
    enabled: z.boolean().default(true),
    /**
     * Path selectors to censor.
     *
     * - `authorization` → a root-level property
     * - `user.password` → an exact nested path
     * - `items.*.token` → wildcard paths
     * - `["set-cookie"]` → bracket notation, required for names that are not
     *   valid identifiers (e.g. containing a hyphen)
     */
    redactPaths: z.array(RedactionSelectorSchema).default(() => [])
});

/**
 * Builds a schema for a fixed set of redactable fields, each defaulting to
 * enabled with the given selectors.
 *
 * A configured `redactPaths` **replaces** the default; it is never merged with it.
 * Callers therefore get exactly what they wrote, and an explicit `[]` means
 * "redact nothing for this field".
 *
 * @example
 * ```ts
 * const HttpRedactionSchema = createRedactionSchema({
 *   headers: [...SENSITIVE_HEADER_SELECTORS],
 *   query: [],
 *   request: [],
 *   response: []
 * });
 * ```
 */
export function createRedactionSchema<K extends string>(
    fields: Record<K, string[]>
): z.ZodObject<Record<K, z.ZodDefault<typeof RedactionFieldOptionsSchema>>> {
    const shape = Object.fromEntries(
        Object.entries<string[]>(fields).map(([field, redactPaths]) => [
            field,
            // The default is declared at BOTH levels on purpose. Zod's `.default()` fires
            // only on `undefined`, so an object-level default alone is skipped the moment a
            // caller writes `headers: { enabled: true }`: the field object is present, and
            // `redactPaths` falls back to the bare `[]` of RedactionFieldOptionsSchema —
            // silently unredacted. Defaulting `redactPaths` too keeps the selectors in place
            // for a partially configured field, which is exactly the case that leaks.
            // Both getters copy, so a caller mutating one parse result cannot poison the next.
            RedactionFieldOptionsSchema
                .extend({ redactPaths: z.array(RedactionSelectorSchema).default(() => [...redactPaths]) })
                .default(() => ({ enabled: true, redactPaths: [...redactPaths] }))
        ])
    ) as Record<K, z.ZodDefault<typeof RedactionFieldOptionsSchema>>;

    return z.object(shape);
}

export type RedactionFieldOptions = z.output<typeof RedactionFieldOptionsSchema>;
export type RedactionFieldOptionsInput = z.input<typeof RedactionFieldOptionsSchema>;

/** Parsed per-field configuration keyed by field name. */
export type RedactionConfig<K extends string = string> = Record<K, RedactionFieldOptions>;
