import { CommonUtils } from '@radoslavirha/utils';
import { AdditionalProperties, CollectionOf, Description, Example, Property, Required } from '@tsed/schema';
import { SwaggerUIConfig } from './SwaggerUIConfig.js';
import { SwaggerDocumentConfig } from './SwaggerDocumentConfig.js';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';

/**
 * Main configuration model for the Swagger module in a Ts.ED application.
 * 
 * This class configures the entire Swagger UI integration including API metadata,
 * multiple document versions, security schemes, and Swagger UI display options.
 * 
 * The configuration is typically created in the application's index.ts/bootstrap file
 * and passed to {@link SwaggerProvider} which converts it into Ts.ED's `SwaggerSettings[]`
 * format for use in the server configuration.
 * 
 * @example
 * ```typescript
 * import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
 * import { SwaggerConfig, SwaggerDocumentConfig, SwaggerProvider } from '@radoslavirha/tsed-swagger';
 * import { CommonUtils } from '@radoslavirha/utils';
 * 
 * // Create Swagger configuration
 * const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
 *     title: 'My API',
 *     version: '1.0.0',
 *     description: 'My API description',
 *     documents: [
 *         CommonUtils.buildModel(SwaggerDocumentConfig, {
 *             docs: 'v1',
 *             security: [SwaggerSecurityScheme.BEARER_JWT]
 *         }),
 *         CommonUtils.buildModel(SwaggerDocumentConfig, {
 *             docs: 'v2',
 *             security: [SwaggerSecurityScheme.BEARER_JWT, SwaggerSecurityScheme.BASIC]
 *         })
 *     ],
 *     swaggerUIOptions: {
 *         validatorUrl: null,
 *         deepLinking: true
 *     },
 *     serverUrl: 'https://api.example.com'
 * });
 * 
 * // Use in server configuration
 * const configuration: ServerConfiguration = {
 *     ...serverConfig,
 *     swagger: new SwaggerProvider(swaggerConfig).config
 * };
 * 
 * const platform = await Platform.bootstrap(Server, configuration);
 * ```
 * 
 * @see {@link SwaggerProvider} - Converts this config into Ts.ED SwaggerSettings
 * @see {@link SwaggerDocumentConfig} - Configuration for individual API versions
 * @see {@link SwaggerUIConfig} - Swagger UI display options
 */
@AdditionalProperties(false)
@Description(`Configuration of the Swagger module for building Swagger UI pages.`)
export class SwaggerConfig {
    /**
     * API title displayed in the Swagger UI header.
     * 
     * This title appears at the top of each Swagger document page and is combined
     * with the document version (e.g., "My API - v1").
     * 
     * @example
     * ```typescript
     * title: 'User Management API'
     * title: 'E-Commerce Platform'
     * ```
     */
    @Required()
    @Property(String)
    @Description(`Title/application name for the Swagger UI page.`)
    @Example('My API')
    public title: string;

    /**
     * API version displayed in the Swagger UI.
     * 
     * This typically represents the application version, not the API document version
     * (which is defined in {@link SwaggerDocumentConfig.docs}). Often sourced from
     * package.json or environment configuration.
     * 
     * @example
     * ```typescript
     * version: '1.0.0'
     * version: '2.3.1-beta'
     * version: process.env.APP_VERSION
     * ```
     */
    @Required()
    @Property(String)
    @Description(`Application name for the Swagger UI page.`)
    @Example('1.0.0')
    public version: string;

    /**
     * API description displayed in the Swagger UI.
     * 
     * Provides an overview of the API's purpose and capabilities. Supports Markdown
     * formatting for rich text descriptions.
     * 
     * @example
     * ```typescript
     * description: 'REST API for managing users and organizations'
     * description: `
     *   ## Features
     *   - User authentication
     *   - CRUD operations
     *   - Advanced filtering
     * `
     * ```
     */
    @Required()
    @Property(String)
    @Description(`Application description for the Swagger UI page.`)
    @Example('This is a description of the application.')
    public description: string;

    /**
     * Array of Swagger document configurations defining different API versions.
     * 
     * Each document represents a separate API version with its own:
     * - URL path (e.g., `/v1/docs`, `/v2/docs`)
     * - Security schemes
     * - Set of endpoints (via `@Docs()` decorator)
     * 
     * @example
     * ```typescript
     * documents: [
     *     CommonUtils.buildModel(SwaggerDocumentConfig, {
     *         docs: 'v1',
     *         security: [SwaggerSecurityScheme.BASIC]
     *     }),
     *     CommonUtils.buildModel(SwaggerDocumentConfig, {
     *         docs: 'v2',
     *         security: [SwaggerSecurityScheme.BEARER_JWT],
     *         outFile: './api-spec-v2.json'
     *     })
     * ]
     * ```
     * 
     * @see {@link SwaggerDocumentConfig} - Document version configuration
     */
    @Required()
    @CollectionOf(SwaggerDocumentConfig)
    @Description(`An array of Swagger documents.`)
    @Example([
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v1',
            security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT]
        }),
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v2',
            security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT]
        })
    ])
    public documents: SwaggerDocumentConfig[];

    /**
     * Swagger UI configuration options passed directly to the Swagger UI library.
     * 
     * Controls the appearance and behavior of the Swagger UI interface.
     * All standard Swagger UI configuration options are supported.
     * 
     * @example
     * ```typescript
     * swaggerUIOptions: {
     *     validatorUrl: null, // Disable spec validation
     *     deepLinking: true, // Enable deep linking
     *     displayOperationId: true, // Show operation IDs
     *     filter: true // Enable operation filtering
     * }
     * ```
     * 
     * @see {@link SwaggerUIConfig} - Available configuration options
     * @see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/ - Swagger UI docs
     */
    @Property(SwaggerUIConfig)
    @Description(`Configuration options for Swagger UI.`)
    public swaggerUIOptions: SwaggerUIConfig = {};

    /**
     * Public server URL for accessing the API, including any proxy-removed paths.
     * 
     * When provided:
     * - Automatically populates `swaggerUIOptions.urls` with document URLs
     * - Used by {@link SwaggerController} to generate correct documentation links
     * - Useful when API is behind a proxy or load balancer
     * 
     * Should include the full base URL without trailing slash.
     * 
     * @example
     * ```typescript
     * serverUrl: 'https://api.example.com'
     * serverUrl: 'https://api.example.com/api' // With path prefix
     * serverUrl: process.env.PUBLIC_API_URL
     * ```
     * 
     * @see {@link SwaggerProvider.generateSettings} - Uses this to build document URLs
     */
    @Property(String)
    @Description('Server URL to be used in the Swagger documentation including any proxy removed paths. Automatically sets urls in Swagger UI config.')
    public serverUrl?: string;
}