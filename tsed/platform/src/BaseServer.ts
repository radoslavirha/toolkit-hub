import { configuration, Configuration } from '@tsed/di';
import { application } from '@tsed/platform-http';
import '@tsed/platform-express';
import '@tsed/ajv';
import { $log } from '@tsed/logger';
import { APIInformation, getServerDefaultConfig } from '@radoslavirha/tsed-configuration';
import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import methodOverride from 'method-override';

/**
 * Base server class with pre-configured Express middleware stack.
 * 
 * Provides a standardized foundation for Ts.ED microservices with common middleware
 * (CORS, compression, body parsing, cookies) and lifecycle hooks. Your server class
 * should extend this and call {@link registerMiddlewares} in the `$beforeRoutesInit` hook.
 * 
 * @remarks
 * This class is decorated with `@Configuration` using default server settings from
 * {@link getServerDefaultConfig}. It automatically logs service information on ready
 * and provides protected access to the Express app instance and Ts.ED settings.
 * 
 * The middleware stack includes:
 * - **CORS**: Configured for credentials and all origins
 * - **Cookie Parser**: Parses Cookie header
 * - **Compression**: gzip/deflate response compression
 * - **Method Override**: HTTP method override via headers/query
 * - **Body Parser**: JSON and URL-encoded body parsing
 * 
 * @example Basic server implementation
 * ```typescript
 * import { BaseServer } from '@radoslavirha/tsed-platform';
 * import { Configuration } from '@tsed/di';
 * 
 * @Configuration({
 *     mount: {
 *         '/api': [`${__dirname}/controllers/**\/*.ts`]
 *     }
 * })
 * export class Server extends BaseServer {
 *     $beforeRoutesInit(): void {
 *         this.registerMiddlewares();
 *     }
 * }
 * ```
 * 
 * @example With custom middleware
 * ```typescript
 * import { BaseServer } from '@radoslavirha/tsed-platform';
 * import { Configuration } from '@tsed/di';
 * import helmet from 'helmet';
 * 
 * @Configuration({
 *     mount: {
 *         '/api': [`${__dirname}/controllers/**\/*.ts`]
 *     }
 * })
 * export class Server extends BaseServer {
 *     $beforeRoutesInit(): void {
 *         // Register base middlewares first
 *         this.registerMiddlewares();
 *         
 *         // Add custom middleware
 *         this.app.use(helmet());
 *     }
 * }
 * ```
 * 
 * @see {@link Platform} for bootstrapping the server
 * @see {@link ServerConfiguration} for configuration typing
 */
@Configuration({
    ...getServerDefaultConfig(),
    api: <APIInformation>{
        service: 'test',
        version: '0.0.1'
    }
})
export class BaseServer {
    /**
     * Express application instance.
     * 
     * Provides access to the underlying Express app for registering custom middleware,
     * routes, or other Express-specific configurations.
     * 
     * @protected
     * @type {Express.Application}
     */
    protected app = application();

    /**
     * Ts.ED configuration settings.
     * 
     * Provides access to the merged configuration from `@Configuration` decorators
     * and bootstrap settings. Use `settings.get<T>(key)` to retrieve specific values.
     * 
     * @private
     * @type {Configuration}
     */
    private settings = configuration();

    /**
     * Lifecycle hook called when the server is fully initialized and ready.
     * 
     * Logs the service name and version from API metadata to indicate successful startup.
     * This hook is automatically invoked by Ts.ED after all providers are initialized
     * but before the HTTP server starts listening.
     * 
     * @remarks
     * Override this method to add custom initialization logic that should run after
     * the server is configured but before it accepts connections.
     * 
     * @example Override for custom ready logic
     * ```typescript
     * $onReady(): void {
     *     super.$onReady(); // Call base implementation
     *     
     *     // Custom initialization
     *     this.initDatabase();
     *     this.startBackgroundJobs();
     * }
     * ```
     */
    $onReady(): void {
        const api = this.settings.get<APIInformation>('api');
        
        $log.info(`${ api?.service } ${ api?.version } is ready!`);
    }

    /**
     * Register common Express middleware stack.
     * 
     * Configures the following middleware in order:
     * 1. **CORS** - Cross-Origin Resource Sharing with credentials support
     * 2. **Cookie Parser** - Parse Cookie header and populate req.cookies
     * 3. **Compression** - gzip/deflate response compression
     * 4. **Method Override** - Override HTTP method via headers or query params
     * 5. **Body Parser (JSON)** - Parse application/json request bodies
     * 6. **Body Parser (URL-encoded)** - Parse application/x-www-form-urlencoded bodies
     * 
     * @protected
     * 
     * @remarks
     * This method should be called in the `$beforeRoutesInit` lifecycle hook to ensure
     * middleware is registered before controllers and routes are initialized.
     * 
     * @example Standard usage
     * ```typescript
     * $beforeRoutesInit(): void {
     *     this.registerMiddlewares();
     * }
     * ```
     * 
     * @example With custom middleware before/after
     * ```typescript
     * $beforeRoutesInit(): void {
     *     // Custom middleware before standard stack
     *     this.app.use(requestLogger());
     *     
     *     // Register standard middleware
     *     this.registerMiddlewares();
     *     
     *     // Custom middleware after standard stack
     *     this.app.use(authMiddleware());
     * }
     * ```
     */
    protected registerMiddlewares(): void {
        $log.info('Registering common middlewares...');

        this.app
            .use(
                cors({
                    origin: true,
                    credentials: true
                })
            )
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(
                bodyParser.urlencoded({
                    extended: true
                })
            );
    }
}