import { BaseConfigProvider } from '@radoslavirha/tsed-configuration';
import { OS3Security, OpenSpec3, OpenSpecHash, OpenSpecInfo } from '@tsed/openspec';
import { SwaggerSettings } from '@tsed/swagger';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';
import { SwaggerConfig } from '../models/SwaggerConfig.js';
import { SwaggerDocumentConfig } from '../models/SwaggerDocumentConfig.js';
import { SWAGGER_SECURITY_SCHEMES } from '../SwaggerSecuritySchemes.js';
import { serialize } from '@tsed/json-mapper';
import { SwaggerUIConfig } from '../models/SwaggerUIConfig.js';

/**
 * Provider that converts {@link SwaggerConfig} into Ts.ED's `SwaggerSettings[]` format.
 * 
 * This provider extends {@link BaseConfigProvider} and transforms the simplified
 * {@link SwaggerConfig} model into the format required by Ts.ED's `@tsed/swagger` module.
 * It generates OpenAPI 3.0.3 specifications for each document version with proper
 * security schemes, metadata, and Swagger UI options.
 * 
 * The provider automatically:
 * - Converts each {@link SwaggerDocumentConfig} into a separate `SwaggerSettings` object
 * - Generates document URLs when `serverUrl` is provided
 * - Maps security schemes from {@link SWAGGER_SECURITY_SCHEMES}
 * - Configures OpenAPI 3.0.3 specification structure
 * - Sets up Swagger UI options for each document
 * 
 * @example
 * ```typescript
 * import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
 * import { SwaggerConfig, SwaggerDocumentConfig, SwaggerProvider } from '@radoslavirha/tsed-swagger';
 * import { CommonUtils } from '@radoslavirha/utils';
 * import { ConfigService } from './ConfigService';
 * 
 * const config = injector().get<ConfigService>(ConfigService);
 * 
 * // Create Swagger configuration
 * const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
 *     title: config.api.service,
 *     version: config.api.version,
 *     description: config.api.description,
 *     documents: [
 *         CommonUtils.buildModel(SwaggerDocumentConfig, {
 *             docs: 'v1',
 *             security: [SwaggerSecurityScheme.BEARER_JWT]
 *         })
 *     ],
 *     swaggerUIOptions: {
 *         validatorUrl: null
 *     },
 *     serverUrl: config.api.publicURL
 * });
 * 
 * // Convert to Ts.ED SwaggerSettings[] and use in server configuration
 * const configuration: ServerConfiguration = {
 *     ...config.server,
 *     api: config.api,
 *     swagger: new SwaggerProvider(swaggerConfig).config
 * };
 * 
 * const platform = await Platform.bootstrap(Server, configuration);
 * ```
 * 
 * @see {@link SwaggerConfig} - Input configuration model
 * @see {@link SwaggerDocumentConfig} - Document version configuration
 * @see {@link BaseConfigProvider} - Base class providing config property
 */
export class SwaggerProvider extends BaseConfigProvider<SwaggerSettings[]> {
    /**
     * Creates a new SwaggerProvider instance that converts {@link SwaggerConfig} into Ts.ED's format.
     * 
     * The constructor immediately processes the configuration by mapping each document
     * in {@link SwaggerConfig.documents} to a `SwaggerSettings` object using
     * {@link generateSettings}.
     * 
     * @param config - The Swagger configuration to convert
     * 
     * @example
     * ```typescript
     * const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
     *     title: 'My API',
     *     version: '1.0.0',
     *     description: 'API description',
     *     documents: [
     *         CommonUtils.buildModel(SwaggerDocumentConfig, {
     *             docs: 'v1',
     *             security: []
     *         })
     *     ]
     * });
     * 
     * const provider = new SwaggerProvider(swaggerConfig);
     * // Access the converted settings via provider.config
     * ```
     */
    constructor(config: SwaggerConfig) {
        super(config.documents.map((docsVersion) => SwaggerProvider.generateSettings(config, docsVersion)));
    }

    /**
     * Generates a `SwaggerSettings` object for a single document version.
     * 
     * This method transforms a {@link SwaggerDocumentConfig} into the format required
     * by `@tsed/swagger`, combining it with global settings from {@link SwaggerConfig}.
     * 
     * The generated settings include:
     * - Document path: `/{docs}/docs`
     * - OpenAPI 3.0.3 specification structure
     * - API metadata (title, version, description)
     * - Security schemes mapped from {@link SWAGGER_SECURITY_SCHEMES}
     * - Swagger UI options with optional auto-generated URLs
     * 
     * @param config - Global Swagger configuration
     * @param settings - Document-specific configuration
     * @returns Ts.ED SwaggerSettings object for this document version
     * 
     * @private
     */
    private static generateSettings(config: SwaggerConfig, settings: SwaggerDocumentConfig): SwaggerSettings {
        const swaggerUIOptions = serialize(config.swaggerUIOptions, { type: SwaggerUIConfig });

        if (config.serverUrl && !swaggerUIOptions.urls) {
            swaggerUIOptions.urls = [
                {
                    name: settings.docs,
                    url: `${ config.serverUrl }/${ settings.docs }/docs/swagger.json`
                }
            ];
        }

        return <SwaggerSettings>{
            path: `/${ settings.docs }/docs`,
            doc: settings.docs,
            specVersion: '3.0.3',
            outFile: settings.outFile,
            spec: <Partial<OpenSpec3>>{
                info: <OpenSpecInfo>{
                    title: `${ config.title } - ${ settings.docs }`,
                    version: config.version,
                    description: config.description
                },
                components: {
                    securitySchemes: SwaggerProvider.getSecuritySchemes(settings.security)
                }
            },
            options: swaggerUIOptions
        };
    }

    /**
     * Maps security scheme enum values to their OpenAPI 3.0 security scheme definitions.
     * 
     * This method converts an array of {@link SwaggerSecurityScheme} enum values into
     * an OpenAPI `components.securitySchemes` object by looking up each scheme's
     * definition in {@link SWAGGER_SECURITY_SCHEMES}.
     * 
     * @param security - Array of security scheme enum values to include
     * @returns OpenAPI security schemes hash for the OpenAPI spec
     * 
     * @example
     * ```typescript
     * // Input: [SwaggerSecurityScheme.BEARER_JWT, SwaggerSecurityScheme.BASIC]
     * // Output:
     * {
     *   BEARER_JWT: {
     *     type: 'http',
     *     scheme: 'bearer',
     *     bearerFormat: 'JWT',
     *     description: 'Bearer JWT token'
     *   },
     *   BASIC: {
     *     type: 'http',
     *     scheme: 'basic',
     *     description: 'Basic authentication'
     *   }
     * }
     * ```
     * 
     * @private
     * @see {@link SWAGGER_SECURITY_SCHEMES} - Source of security scheme definitions
     */
    private static getSecuritySchemes(security: SwaggerSecurityScheme[]): OpenSpecHash<OS3Security> {
        const schemes: OpenSpecHash<OS3Security> = {};

        for (const scheme of security) {
            schemes[scheme] = SWAGGER_SECURITY_SCHEMES[scheme];
        }

        return schemes;
    }
}
