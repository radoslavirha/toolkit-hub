import { configuration, Configuration, Inject } from '@tsed/di';
import { application } from '@tsed/platform-http';
import '@tsed/platform-express';
import '@tsed/ajv';
import '@tsed/platform-log-request';
import { APIInformation, getServerDefaultConfig } from '@radoslavirha/tsed-configuration';
import { Logger } from '@radoslavirha/tsed-logger';
import { TsEDLoggerBridge } from './TsEDLoggerBridge.js';
import bodyParser from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';

/**
 * Base server class with pre-configured Express middleware stack.
 * 
 * Provides a standardized foundation for Ts.ED microservices with common middleware
 * (compression, body parsing, cookies) and lifecycle hooks. {@link registerMiddlewares} runs
 * automatically from the `$beforeRoutesInit` hook; override it (and call `super`) to add your own.
 * 
 * @remarks
 * This class is decorated with `@Configuration` using default server settings from
 * {@link getServerDefaultConfig}. It automatically logs service information on ready
 * and provides protected access to the Express app instance and Ts.ED settings.
 * 
 * The middleware stack includes:
 * - **Cookie Parser**: Parses Cookie header
 * - **Compression**: gzip/deflate response compression
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
 * export class Server extends BaseServer {}
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
 *     protected registerMiddlewares(): void {
 *         // Register base middlewares first
 *         super.registerMiddlewares();
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

    @Inject(Logger)
    private logger!: Logger;

    /** Injected to ensure the Ts.ED $log bridge is bootstrapped with the DI Logger. */
    @Inject(TsEDLoggerBridge)
    private tsedLoggerBridge!: TsEDLoggerBridge;

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
        this.logger.info(`${ api?.service } ${ api?.version } is ready!`);
    }

    /**
     * Lifecycle hook that registers the middleware stack before routes are initialized.
     * 
     * @remarks
     * Calls {@link registerMiddlewares}. Subclasses that override this hook must call
     * `super.$beforeRoutesInit()` or `this.registerMiddlewares()` themselves.
     */
    $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }

    /**
     * Register common Express middleware stack.
     * 
     * Configures the following middleware in order:
     * 1. **Cookie Parser** - Parse Cookie header and populate req.cookies
     * 2. **Compression** - gzip/deflate response compression
     * 3. **Body Parser (JSON)** - Parse application/json request bodies
     * 4. **Body Parser (URL-encoded)** - Parse application/x-www-form-urlencoded bodies
     * 
     * @protected
     * 
     * @remarks
     * CORS and HTTP method override are intentionally not registered: services run behind a
     * gateway that owns CORS, and the app must not emit `Access-Control-*` headers.
     * 
     * Invoked by the base `$beforeRoutesInit` hook, so middleware is registered before
     * controllers and routes are initialized. Override this method (calling `super`) to add
     * middleware. A subclass that overrides `$beforeRoutesInit` itself must call
     * `this.registerMiddlewares()` (or `super.$beforeRoutesInit()`) or the stack is not registered.
     * 
     * @example With custom middleware before/after
     * ```typescript
     * protected registerMiddlewares(): void {
     *     // Custom middleware before standard stack
     *     this.app.use(requestLogger());
     *     
     *     super.registerMiddlewares();
     *     
     *     // Custom middleware after standard stack
     *     this.app.use(authMiddleware());
     * }
     * ```
     */
    protected registerMiddlewares(): void {
        this.logger.info('Registering common middlewares...');

        this.app
            .use(cookieParser())
            .use(compress({}))
            .use(bodyParser.json())
            .use(
                bodyParser.urlencoded({
                    extended: true
                })
            );
    }
}