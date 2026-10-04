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
 * Configuration provider that exposes the process environment variables (`process.env`).
 *
 * `.env` files are not loaded. Set variables in whatever starts the process (Kubernetes,
 * Docker, the shell); the `config` package reads the same `process.env` for `NODE_ENV` and
 * `custom-environment-variables.json`, so `envs` and `config` always agree.
 * 
 * @extends BaseConfigProvider<ENVS>
 * 
 * @example
 * ```typescript
 * // PORT=3000 NODE_ENV=development node dist/index.js
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
 * - Snapshots process.env during construction
 * - Provides immutable access to environment via BaseConfigProvider
 * - All values are strings (use parsing utilities for numbers/booleans)
 */
export class EnvironmentVariablesProvider extends BaseConfigProvider<ENVS> {
    constructor() {
        super({ ...process.env });
    }
}
