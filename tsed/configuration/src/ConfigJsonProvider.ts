import { createRequire } from 'node:module';
import { config } from 'dotenv';
import { type ZodType } from 'zod';
import type { Config } from 'config';
import { ZodValidator } from '@radoslavirha/tsed-common';
import { BaseConfigProvider } from './BaseConfigProvider.js';
import { BaseConfig } from './models/BaseConfig.js';

/**
 * Configuration provider that loads and validates JSON configuration files
 * using a Zod schema.
 *
 * Uses the `config` package to load environment-specific configuration files
 * (`config/default.json`, `config/development.json`, `config/production.json`, …)
 * and validates the result with {@link ZodValidator}.
 *
 * @template T The configuration model type
 * @extends BaseConfigProvider<T>
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const ServerConfigSchema = z.object({
 *     server: z.object({ httpPort: z.number() }),
 *     serviceName: z.string().optional(),
 *     publicURL: z.string().optional(),
 * });
 *
 * const provider = new ConfigJsonProvider(ServerConfigSchema);
 * ```
 *
 * @throws {Error} If configuration file is missing, invalid JSON, or fails validation
 */
export class ConfigJsonProvider<T extends BaseConfig> extends BaseConfigProvider<T> {
    /**
     * Creates a provider that validates config using a Zod schema.
     * @param schema A Zod schema whose inferred output type extends `BaseConfig`.
     * @param debug If true, logs the raw configuration for debugging. Defaults to false.
     */
    constructor(schema: ZodType<T>, debug = false) {
        super(ConfigJsonProvider.validateConfigFile(schema, debug));
    }

    /**
     * Loads the `config` package on first use rather than at import time.
     *
     * `config` resolves `NODE_ENV` and `custom-environment-variables.json` when it is evaluated,
     * so it must run after `.env` has been loaded into `process.env`. A static import would be
     * evaluated before any code in this package runs (bundlers hoist external imports).
     *
     * @returns The `config` singleton.
     */
    private static loadConfig(): Config {
        config({ quiet: true });
        return createRequire(import.meta.url)('config') as Config;
    }

    /**
     * Validates the raw config file against the provided Zod schema.
     *
     * @param schema A Zod schema to validate against.
     * @param debug If true, enables debug logging in {@link ZodValidator}.
     * @returns The validated configuration.
     * @throws {Error} If validation fails, after logging each individual issue.
     */
    static validateConfigFile<T extends BaseConfig>(schema: ZodType<T>, debug = false): T {
        try {
            return ZodValidator.validate<T>(schema, ConfigJsonProvider.loadConfig(), debug);
        } catch (error) {
            console.error(`Configuration validation failed: ${error}`);
            throw new Error(`Invalid configuration! ${error}`);
        }
    }
}
