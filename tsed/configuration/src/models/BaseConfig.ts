import { z } from 'zod';
import { ServerConfig } from './ServerConfig.js';

/**
 * Base Zod schema for JSON configuration files.
 *
 * All application configuration schemas should be built by extending this schema
 * to ensure consistent server configuration and metadata properties.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { BaseConfig } from '@radoslavirha/tsed-configuration';
 *
 * export const AppConfig = BaseConfig.extend({
 *     databaseUrl: z.string(),
 *     apiKey: z.string()
 * });
 *
 * export type AppConfig = z.infer<typeof AppConfig>;
 * ```
 */
export const BaseConfig = z.object({
    /** TsED server configuration settings. */
    server: ServerConfig.describe('Ts.ED server settings. Keys other than httpPort are passed to the Ts.ED server configuration unchanged.'),
    /** Service name. If not set, the name from package.json will be used. */
    serviceName: z.string().optional().describe('Service name. Defaults to the name in package.json.'),
    /** Public URL of the service including protocol, domain and path if deployed behind a reverse proxy. */
    publicURL: z.string().optional().describe('Public URL of the service, with protocol, host and path, when it is served behind a reverse proxy.')
});

/**
 * TypeScript type for the base configuration.
 * Derived from {@link BaseConfig}.
 */
export type BaseConfig = z.infer<typeof BaseConfig>;