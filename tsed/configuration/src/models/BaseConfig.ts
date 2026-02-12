import { Description, Property, Required } from '@tsed/schema';
import { ServerConfig } from './ServerConfig.js';

/**
 * Base model for JSON configuration files.
 * 
 * This class serves as the foundation for application configuration models.
 * All custom configuration classes should extend this base class to ensure
 * consistent server configuration and metadata properties.
 * 
 * @remarks
 * - Should be decorated with @tsed/schema decorators for JSON Schema validation
 * - Configuration files are loaded from the `config/` directory via the 'config' package
 * - Validated using Ajv against the generated JSON Schema
 * 
 * @example
 * ```typescript
 * import { Property } from '@tsed/schema';
 * import { BaseConfig } from './models/BaseConfig.js';
 * 
 * export class AppConfig extends BaseConfig {
 *     @Property()
 *     databaseUrl: string;
 *     
 *     @Property()
 *     apiKey: string;
 * }
 * ```
 */
@Description('Base server configuration.')
export class BaseConfig {
    /**
     * TsED server configuration settings.
     * @type {ServerConfig}
     */
    @Required()
    @Property(ServerConfig)
    @Description('TsED server configuration.')
    public server: ServerConfig;

    /**
     * Service name. If not set, the name from package.json will be used.
     * @type {string}
     */

    @Property(String)
    @Description('Service name. If not set, the name from package.json will be used.')
    public serviceName?: string;

    /**
     * Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.
     * @type {string}
     * @example 'https://api.example.com/v1'
     */
    @Property(String)
    @Description('Public URL of the service including protocol, domain and path if deployed behind a reverse proxy.')
    public publicURL?: string;
}