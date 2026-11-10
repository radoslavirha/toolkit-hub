import { CommonUtils } from '@radoslavirha/utils';
import type { z } from 'zod';
import type { ConfigDocsOptions } from './ConfigDocsOptions.js';
import { ConfigDocsRenderer } from './ConfigDocsRenderer.js';
import type { JsonSchemaNode } from './JsonSchemaNode.js';
import { JsonSchemaNormaliser } from './JsonSchemaNormaliser.js';

/**
 * Generates a human-readable configuration reference (Markdown) from a service's Zod
 * configuration schema — the shared `BaseConfig` fields included.
 *
 * The schema is converted with its own `toJSONSchema({ io: 'input' })`, so the page describes
 * what goes **into** the config file: a key with a default is optional, and a transform's output
 * type is not shown. Field descriptions come from `.describe()`; JSDoc is invisible to it.
 *
 * Keep the page current with a file snapshot, which fails in CI when the schema changes and is
 * rewritten by `vitest -u`:
 *
 * @example
 * ```typescript
 * import { ConfigDocs } from '@radoslavirha/tsed-configuration';
 * import { ConfigSchema } from './ConfigModel.js';
 *
 * it('CONFIGURATION.md matches the schema', async () => {
 *     await expect(ConfigDocs.render(ConfigSchema, { title: 'my-api' }))
 *         .toMatchFileSnapshot('../../../CONFIGURATION.md');
 * });
 * ```
 */
export class ConfigDocs {
    /**
     * Renders the configuration reference.
     *
     * Types JSON Schema cannot express (`z.custom`, `z.date`, ...) are rendered as `any`. A
     * `z.preprocess` step is invisible: its inner schema is shown, so a default the preprocess
     * fills in belongs in that field's `.describe()`.
     */
    public static render(schema: z.ZodType, options: ConfigDocsOptions): string {
        // The schema's own method, not `z.toJSONSchema`: descriptions live in the registry of the
        // Zod copy that built the schema, which need not be this package's copy.
        const jsonSchema = schema.toJSONSchema({ io: 'input', unrepresentable: 'any' }) as JsonSchemaNode;
        const root = JsonSchemaNormaliser.normalise(jsonSchema);
        if (CommonUtils.isNull(root)) {
            throw new Error('The configuration schema can never be satisfied (contradicting allOf members).');
        }
        return new ConfigDocsRenderer(root, options).render();
    }
}
