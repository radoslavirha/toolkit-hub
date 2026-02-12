import { APIInformation } from '@radoslavirha/tsed-configuration';
import { Constant, Controller, Inject } from '@tsed/di';
import { HeaderParams } from '@tsed/platform-params';
import PlatformViews from '@tsed/platform-views';
import { Get, Hidden, Returns } from '@tsed/schema';
import { SwaggerSettings } from '@tsed/swagger';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Controller that provides a unified landing page for all Swagger document versions.
 * 
 * This controller serves as the entry point for API documentation, displaying a custom
 * view that lists all available Swagger document versions (e.g., v1, v2) with links to
 * their respective Swagger UI pages. It's mounted at the root path and provides a
 * user-friendly interface for discovering and accessing API documentation.
 * 
 * The controller:
 * - Displays all configured Swagger documents with clickable links
 * - Handles proxy/load balancer scenarios by detecting public URL
 * - Renders an EJS template with service metadata
 * - Is hidden from Swagger documentation itself (`@Hidden()`)
 * 
 * @example
 * ```typescript
 * import { Configuration } from '@tsed/di';
 * import { SwaggerController } from '@radoslavirha/tsed-swagger';
 * 
 * @Configuration({
 *     mount: {
 *         '/': [SwaggerController]
 *     }
 * })
 * export class Server extends BaseServer {
 *     $beforeRoutesInit(): void {
 *         this.registerMiddlewares();
 *     }
 * }
 * ```
 * 
 * When mounted at `/`, visiting the root URL will display:
 * - Service name and version
 * - List of available Swagger documentation versions
 * - Links to each version's Swagger UI (e.g., `/v1/docs`, `/v2/docs`)
 * 
 * @see {@link SwaggerProvider} - Provides the SwaggerSettings[] configuration
 * @see {@link SwaggerConfig} - Source of API metadata
 */
@Hidden()
@Controller('/')
export class SwaggerController {
    /**
     * Array of Swagger settings for all configured document versions.
     * 
     * Injected from the server configuration's `swagger` property, which is
     * typically provided by {@link SwaggerProvider.config}.
     * 
     * @private
     */
    @Constant('swagger')
    private swagger!: SwaggerSettings[];

    /**
     * API metadata including service name, version, and public URL.
     * 
     * Injected from the server configuration's `api` property, typically
     * provided by platform configuration.
     * 
     * @private
     */
    @Constant('api')
    private api!: APIInformation;

    /**
     * Platform views service for rendering EJS templates.
     * 
     * @private
     */
    @Inject(PlatformViews)
    private platformViews: PlatformViews;

    /**
     * Handles GET requests to the root path, rendering the Swagger documentation landing page.
     * 
     * This endpoint:
     * - Detects the public URL from configuration or request headers
     * - Renders an EJS template listing all Swagger document versions
     * - Handles both direct access and proxy/load balancer scenarios
     * - Returns HTML content with links to all Swagger UI pages
     * 
     * The rendered page includes:
     * - Service name from {@link APIInformation.service}
     * - Application version from {@link APIInformation.version}
     * - Clickable cards for each document version
     * - Full URLs to each version's Swagger UI
     * 
     * @param protocol - HTTP protocol from x-forwarded-proto header (http/https)
     * @param host - Host from host header (e.g., api.example.com)
     * @returns HTML content with document listing
     * 
     * @example
     * ```
     * GET /
     * Host: api.example.com
     * X-Forwarded-Proto: https
     * 
     * Response: HTML page with links like:
     * - https://api.example.com/v1/docs
     * - https://api.example.com/v2/docs
     * ```
     */
    @Get('/')
    @(Returns(200, String).ContentType('text/html'))
    async get(
        @HeaderParams('x-forwarded-proto')
        protocol: string,
        @HeaderParams('host')
        host: string
    ) {
        const hostUrl = this.api.publicURL ?? `${ protocol || 'http' }://${ host }`;

        const _dirname = typeof __dirname !== 'undefined'
            ? __dirname
            : path.dirname(fileURLToPath(import.meta.url));

        // files are compiled by tsup into single index.ts file
        // we need to keep assets in the same directory as index.ts
        // views are copied by cpx library into dist directory
        return await this.platformViews.render(path.join(_dirname, 'views', 'swagger.ejs'), {
            BASE_URL: hostUrl,
            SERVICE: this.api.service,
            VERSION: this.api.version,
            docs: this.swagger.map((conf) => {
                return {
                    url: hostUrl + conf.path + '/',
                    ...conf
                };
            })
        });
    }
}
