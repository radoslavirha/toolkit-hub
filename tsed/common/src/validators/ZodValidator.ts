import type { ZodType } from 'zod';

export class ZodValidator {
    /**
     * Validates arbitrary input against a Zod schema.
     *
     * `zod` is a peer dependency — pass any Zod schema instance and
     * because the schema object itself originates from `zod`, the package is
     * guaranteed to be present at runtime. No runtime availability check is performed.
     *
     * @template T The output type inferred from the schema.
     * @param schema A Zod schema (e.g. `z.object(...)`, `z.union([...])`).
     * @param input Arbitrary raw input to validate (typically a plain object from JSON).
     * @param debug When `true`, logs the raw input to `console.log`.
     * @returns The validated `T` value.
     * @throws {ZodError} The Zod error (`.issues` array) when validation fails.
     *
     * @example
     * ```typescript
     * import { z } from 'zod';
     * import { ZodValidator } from '@radoslavirha/tsed-common';
     *
     * const MqttConfigSchema = z.union([
     *     z.object({ enabled: z.literal(true),              url: z.string()            }),
     *     z.object({ enabled: z.literal(false).optional(),  url: z.string().optional() }),
     * ]);
     * type MqttConfig = z.infer<typeof MqttConfigSchema>;
     *
     * // Valid – full TS narrowing after validation:
     * ZodValidator.validate(MqttConfigSchema, { enabled: true, url: 'mqtt://host' });
     * ```
     */
    public static validate<T extends object>(schema: ZodType<T>, input: unknown, debug = false): T {
        if (debug) {
            console.log('Raw data:', JSON.stringify(input, null, 2));
        }

        const result = schema.safeParse(input);

        if (!result.success) {
            throw result.error;
        }

        return result.data;
    }
}
