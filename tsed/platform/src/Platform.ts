import { Type } from '@tsed/core';
import { PlatformExpress } from '@tsed/platform-express';
import { ServerConfiguration } from './ServerConfiguration.js';

/**
 * Express-based Ts.ED platform adapter.
 * 
 * Extends {@link PlatformExpress} to provide a standardized platform bootstrap utility
 * for starting Ts.ED microservices with Express as the HTTP server.
 * 
 * @remarks
 * This class acts as a thin wrapper around Ts.ED's PlatformExpress, providing a consistent
 * bootstrap interface for use across toolkit microservices. It integrates with {@link ServerConfiguration}
 * to ensure proper typing for API metadata and server configuration.
 * 
 * @example
 * ```typescript
 * import { Platform, ServerConfiguration, BaseServer } from '@radoslavirha/tsed-platform';
 * import { ConfigService } from './config/ConfigService';
 * 
 * const config = injector().get<ConfigService>(ConfigService);
 * 
 * const configuration: ServerConfiguration = {
 *     ...config.server,
 *     api: config.api
 * };
 * 
 * const platform = await Platform.bootstrap(Server, configuration);
 * await platform.listen();
 * ```
 * 
 * @see {@link ServerConfiguration} for configuration typing
 * @see {@link BaseServer} for server implementation patterns
 */
export class Platform extends PlatformExpress {
    /**
     * Bootstrap a Ts.ED application with Express platform.
     * 
     * Initializes the Ts.ED dependency injection container, registers the provided server module,
     * applies configuration, and prepares the application for listening on HTTP ports.
     * 
     * @template T - Server class type extending Ts.ED's configuration decorators
     * @param module - The server class decorated with `@Configuration` (typically extends {@link BaseServer})
     * @param settings - Server configuration including API metadata and Ts.ED settings
     * @returns Platform instance with methods for starting the server (`.listen()`)
     * 
     * @example
     * ```typescript
     * // Bootstrap with server configuration
     * const platform = await Platform.bootstrap(Server, {
     *     httpPort: 4000,
     *     api: {
     *         service: 'my-api',
     *         version: '1.0.0',
     *         description: 'My API Service'
     *     }
     * });
     * 
     * // Start listening
     * await platform.listen();
     * ```
     * 
     * @throws {Error} If server initialization fails or configuration is invalid
     */
    static bootstrap(module: Type, settings: ServerConfiguration): ReturnType<typeof PlatformExpress.bootstrap> {
        return PlatformExpress.bootstrap(module, settings);
    }
}
