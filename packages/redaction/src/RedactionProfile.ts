import { RedactionUtils, type RedactorFunction } from './RedactionUtils.js';
import type { RedactionConfig } from './RedactionOptions.schema.js';
import { CommonUtils } from '@radoslavirha/utils';

/**
 * A set of named, **pre-compiled** redactors built once from configuration.
 *
 * `fast-redact` compiles each redactor with `new Function`, so building one per
 * call would dominate the cost of logging. Construct a profile once — per
 * logger, per HTTP provider, per repository — and call {@link collect} or
 * {@link redact} on every request; those only invoke the already-compiled
 * functions.
 *
 * The profile deliberately returns data rather than logging it: the caller owns
 * the log structure, this only sanitises the values that go into it.
 *
 * @example
 * ```ts
 * // once, at construction
 * const profile = new RedactionProfile({
 *   headers:  { enabled: true,  redactPaths: ['authorization'] },
 *   response: { enabled: true,  redactPaths: ['access_token'] },
 *   request:  { enabled: false, redactPaths: [] }
 * });
 *
 * // per call — no compilation
 * logger.info('Request completed', {
 *   method, url, status,
 *   ...profile.collect({ headers, response, request })
 * });
 * // -> { headers: '{"authorization":"***"}', response: '...' }  ('request' omitted)
 * ```
 */
export class RedactionProfile<K extends string = string> {
    private readonly redactors: Map<K, RedactorFunction>;

    /**
     * @param config Per-field options. Disabled fields are skipped entirely — no
     *   redactor is compiled for them.
     */
    public constructor(config: Partial<RedactionConfig<K>>) {
        this.redactors = new Map();

        for (const [field, options] of Object.entries(config) as [K, RedactionConfig<K>[K] | undefined][]) {
            if (CommonUtils.notUndefined(options) && options.enabled !== false) {
                this.redactors.set(field, RedactionUtils.compileRedactor(options.redactPaths));
            }
        }
    }

    /** True when the field is configured and enabled. */
    public isEnabled(field: K): boolean {
        return this.redactors.has(field);
    }

    /**
     * Redacts and serialises one field.
     *
     * @returns `undefined` when the field is disabled or unconfigured, so the
     *   caller can spread the result without emitting an empty key.
     */
    public redact(field: K, value: unknown): string | undefined {
        return this.redactors.get(field)?.(value);
    }

    /**
     * Redacts every enabled field of `values` in one pass.
     *
     * Fields that are disabled, unconfigured, or absent from `values` are
     * omitted from the result, so it can be spread straight into a log payload.
     */
    public collect(values: Partial<Record<K, unknown>>): Partial<Record<K, string>> {
        const collected: Partial<Record<K, string>> = {};

        for (const [field, redactor] of this.redactors) {
            if (field in values) {
                collected[field] = redactor(values[field]);
            }
        }

        return collected;
    }
}
