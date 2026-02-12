import { config } from 'dotenv';
import { BaseConfigProvider } from './BaseConfigProvider.js';

/**
 * Interface representing environment variables as key-value pairs.
 * @template TValue The value type, defaults to string | undefined
 */
export interface ENVS<TValue = string | undefined> {
    /** Environment variable key-value pairs */
    [key: string]: TValue;
}

/**
 * Configuration provider that loads and manages environment variables.
 * 
 * Automatically loads environment variables from two sources:
 * 1. Process environment variables (process.env)
 * 2. .env file in the project root (via dotenv)
 * 
 * **Precedence:** Process environment variables override .env file values.
 * This allows deployment environments to override local .env settings.
 * 
 * @extends BaseConfigProvider<ENVS>
 * 
 * @example
 * ```typescript
 * // .env file:
 * // PORT=3000
 * // NODE_ENV=development
 * 
 * const envProvider = new EnvironmentVariablesProvider();
 * const env = envProvider.config;
 * 
 * const port = env.PORT; // '3000'
 * const nodeEnv = env.NODE_ENV; // 'development'
 * 
 * // Type-safe access with defaults
 * const apiUrl = env.API_URL ?? 'http://localhost:3000';
 * ```
 * 
 * @remarks
 * - Loads .env file synchronously during construction
 * - Does not throw if .env file is missing (dotenv default behavior)
 * - Process environment variables always take precedence over .env file
 * - Provides immutable access to environment via BaseConfigProvider
 * - All values are strings (use parsing utilities for numbers/booleans)
 */
export class EnvironmentVariablesProvider extends BaseConfigProvider<ENVS> {
    constructor() {
        // Load .env file first (if exists)
        const dotenvConfig = config().parsed ?? {};
        
        // Merge with precedence: process.env overrides .env file
        super({
            ...dotenvConfig,
            ...process.env
        });
    }
}
