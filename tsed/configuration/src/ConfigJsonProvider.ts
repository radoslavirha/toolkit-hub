import { Type } from '@tsed/core';
import cfg from 'config';
import { JSONSchemaValidator } from '@radoslavirha/tsed-common';
import { BaseConfigProvider } from './BaseConfigProvider.js';
import { BaseConfig } from './models/BaseConfig.js';

/**
 * Configuration provider that loads and validates JSON configuration files.
 * 
 * Uses the 'config' package to load environment-specific configuration files
 * (e.g., default.json, development.json, production.json) and validates them
 * against a TypeScript model using JSON Schema and Ajv.
 * 
 * The configuration files should be in the `config/` directory:
 * - `config/default.json` - Base configuration
 * - `config/development.json` - Development overrides
 * - `config/production.json` - Production overrides
 * - etc.
 * 
 * @template T The configuration model type
 * @extends BaseConfigProvider<T>
 * 
 * @example
 * ```typescript
 * import { Property } from '@tsed/schema';
 * 
 * class ServerConfig {
 *     @Property()
 *     port: number;
 *     
 *     @Property()
 *     host: string;
 * }
 * 
 * // Loads and validates config/default.json (or environment-specific)
 * const configProvider = new ConfigJsonProvider(ServerConfig);
 * const config = configProvider.config;
 * 
 * console.log(`Server: ${config.host}:${config.port}`);
 * ```
 * 
 * @example
 * ```typescript
 * // With debug logging
 * const configProvider = new ConfigJsonProvider(ServerConfig, true);
 * ```
 * 
 * @remarks
 * - Uses 'config' package for environment-aware configuration loading
 * - Validates configuration against JSON Schema derived from TypeScript decorators
 * - Throws detailed error if validation fails
 * - Configuration is deserialized into typed model instances
 * - Provides immutable access via BaseConfigProvider
 * 
 * @throws {Error} If configuration file is missing, invalid JSON, or fails validation
 */
export class ConfigJsonProvider<T extends BaseConfig> extends BaseConfigProvider<T> {
    /**
     * Creates a new configuration provider.
     * @param configModel The TypeScript class decorated with @Property for validation
     * @param debug If true, logs the raw configuration for debugging. Defaults to false.
     */
    constructor(configModel: Type<T>, debug = false) {
        super(ConfigJsonProvider.validateConfigFile(configModel, debug));
    }

    /**
     * Validates the configuration file against the model schema.
     * @template T The configuration model type
     * @param configModel The model class to validate against
     * @param debug If true, enables debug logging
     * @returns The validated and deserialized configuration
     * @throws {Error} If validation fails with detailed error messages
     */
    static validateConfigFile<T>(configModel: Type<T>, debug = false): T {
        try {
            return JSONSchemaValidator.validate(configModel, cfg, debug);
        } catch (errors) {
            // Log individual validation errors
            if (Array.isArray(errors)) {
                console.error('Configuration validation failed:');
                for (const error of errors) {
                    const path = error.instancePath || 'root';
                    console.error(`  - ${path}: ${error.keyword} ${error.message}`);
                }
            }
            
            throw new Error(`Invalid configuration! Check the errors above or verify your config file.`);
        }
    }
}
