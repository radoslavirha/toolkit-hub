import { PlatformExpress } from '@tsed/platform-express';
import { PlatformBuilder } from '@tsed/platform-http';
import { ServerConfiguration } from './ServerConfiguration.js';
import { injector } from '@tsed/di';
import { TsEDLoggerBridge } from './TsEDLoggerBridge.js';

/**
 * Express-based Ts.ED platform bootstrap utility.
 * 
 * Wraps {@link PlatformExpress} to provide a standardized bootstrap entrypoint
 * for starting Ts.ED microservices with Express as the HTTP server.
 * 
 * @remarks
 * This class is a thin wrapper around Ts.ED's PlatformExpress, providing a consistent
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
 *     rootModule: Server,
 *     ...config.server,
 *     api: config.api
 * };
 * 
 * const platform = await Platform.bootstrap(configuration);
 * await platform.listen();
 * ```
 * 
 * @see {@link ServerConfiguration} for configuration typing
 * @see {@link BaseServer} for server implementation patterns
 */
export class Platform {
    /**
     * Bootstrap a Ts.ED application with Express platform.
     * 
     * Initializes the Ts.ED dependency injection container, registers the server module given
     * as `rootModule`, applies configuration, and prepares the application for listening on HTTP ports.
     * 
     * @param settings - Server configuration including the `rootModule` server class,
     *                   API metadata and Ts.ED settings
     * @returns Platform instance with methods for starting the server (`.listen()`)
     * 
     * @example
     * ```typescript
     * // Bootstrap with server configuration
     * const platform = await Platform.bootstrap({
     *     rootModule: Server,
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
    static bootstrap(settings: ServerConfiguration): ReturnType<typeof PlatformExpress.bootstrap> {
        const loggerBridge = injector().get<TsEDLoggerBridge>(TsEDLoggerBridge);
        settings.logger = loggerBridge.getTsEDLoggerConfig({ ...settings.logger , logRequest: false });

        // Not PlatformExpress.bootstrap(settings): since 8.38.2 both overloads route through
        // PlatformBuilder.options(), which tells a root module from a settings object with
        // isClass() — and isClass() returns true for plain objects, since it only rejects
        // Object itself. A settings-only call is therefore read as a root module and every
        // key, rootModule included, is dropped. Building the PlatformBuilder directly is what
        // the adapter itself did up to 8.38.0.
        return new PlatformBuilder({ ...settings, adapter: PlatformExpress }).bootstrap();
    }
}
