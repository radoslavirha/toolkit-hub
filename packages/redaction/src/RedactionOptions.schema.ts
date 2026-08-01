import { z } from 'zod';

/** A single `fast-redact` path selector. */
export const RedactionSelectorSchema = z.string().trim().min(1);

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
 * @example
 * ```ts
 * const HttpRedactionSchema = createRedactionSchema({
 *   headers: ['authorization'],
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
            RedactionFieldOptionsSchema.default(() => ({ enabled: true, redactPaths: [...redactPaths] }))
        ])
    ) as Record<K, z.ZodDefault<typeof RedactionFieldOptionsSchema>>;

    return z.object(shape);
}

export type RedactionFieldOptions = z.output<typeof RedactionFieldOptionsSchema>;
export type RedactionFieldOptionsInput = z.input<typeof RedactionFieldOptionsSchema>;

/** Parsed per-field configuration keyed by field name. */
export type RedactionConfig<K extends string = string> = Record<K, RedactionFieldOptions>;
