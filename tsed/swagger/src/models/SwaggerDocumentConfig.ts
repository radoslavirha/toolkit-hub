import { AdditionalProperties, CollectionOf, Description, Example, Property, Required } from '@tsed/schema';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';

/**
 * Configuration model for a single Swagger document version.
 * 
 * This model defines a specific API version/document that will be exposed in the Swagger UI.
 * Multiple documents can be configured to support different API versions (e.g., v1, v2) with
 * different security requirements.
 * 
 * The `docs` property value:
 * - Defines the URL path segment: `/{docs}/docs`
 * - Should match the value used in `@Docs()` decorator from `@tsed/swagger`
 * - Appears in the Swagger UI document selector
 * 
 * @example
 * ```typescript
 * import { CommonUtils } from '@radoslavirha/utils';
 * import { SwaggerDocumentConfig, SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';
 * 
 * // Define multiple API versions with different security
 * const v1Config = CommonUtils.buildModel(SwaggerDocumentConfig, {
 *     docs: 'v1',
 *     security: [SwaggerSecurityScheme.BASIC]
 * });
 * 
 * const v2Config = CommonUtils.buildModel(SwaggerDocumentConfig, {
 *     docs: 'v2',
 *     security: [SwaggerSecurityScheme.BEARER_JWT],
 *     outFile: './swagger-v2.json'
 * });
 * 
 * // Use in controller with @Docs decorator
 * import { Docs } from '@tsed/swagger';
 * 
 * @Controller('/users')
 * @Docs('v1') // Associates this controller with v1 document
 * export class UserControllerV1 {
 *     // ... endpoints appear only in v1 Swagger UI
 * }
 * 
 * @Controller('/users')
 * @Docs('v2') // Associates this controller with v2 document
 * export class UserControllerV2 {
 *     // ... endpoints appear only in v2 Swagger UI
 * }
 * ```
 * 
 * @see {@link SwaggerConfig.documents} - Array of document configs
 * @see {@link SwaggerSecurityScheme} - Available security schemes
 */
@AdditionalProperties(false)
@Description(`Configuration model for Swagger document/version.`)
export class SwaggerDocumentConfig {
    /**
     * Version identifier for the document (e.g., 'v1', 'v2', 'internal').
     * 
     * This value:
     * - Defines the URL path: `/{docs}/docs` (e.g., `/v1/docs`)
     * - Must match the value used in `@Docs('{value}')` decorator
     * - Appears in Swagger UI document selector dropdown
     * - Used to generate `swagger.json` URL: `/{docs}/docs/swagger.json`
     * 
     * @example
     * ```typescript
     * docs: 'v1' // Creates endpoint at /v1/docs
     * docs: 'v2' // Creates endpoint at /v2/docs
     * docs: 'internal' // Creates endpoint at /internal/docs
     * ```
     */
    @Required()
    @Property(String)
    @Description(`Version of the document like v1. This version is used in the URL path to access the Swagger UI.
        The same value should be used in @Docs() decorator.`)
    @Example('v1')
    public docs: string;

    /**
     * Array of security schemes to include in this document version.
     * 
     * Security schemes defined here will be available in the OpenAPI spec's
     * `components.securitySchemes` section for this document. Endpoints can then
     * reference these schemes using the `@Security()` decorator.
     * 
     * @example
     * ```typescript
     * // Document with multiple security options
     * security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT]
     * 
     * // Document with only JWT
     * security: [SwaggerSecurityScheme.BEARER_JWT]
     * 
     * // Document with no authentication
     * security: []
     * ```
     * 
     * @see {@link SwaggerSecurityScheme} - Available security scheme types
     */
    @CollectionOf(SwaggerSecurityScheme)
    @Description(`An array of used security schemes used in this document/version.
        Single value should be used in @Security() decorator.`)
    @Example([SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT])
    public security: SwaggerSecurityScheme[];

    /**
     * Optional file path where the raw `swagger.json` should be saved.
     * 
     * When specified, the generated OpenAPI specification will be written to this file.
     * Useful for:
     * - API client generation from OpenAPI spec
     * - Version control of API specifications
     * - Documentation as code practices
     * - CI/CD validation of API contracts
     * 
     * @example
     * ```typescript
     * outFile: './docs/swagger-v1.json'
     * outFile: './api-spec.json'
     * ```
     */
    @Property(String)
    @Description(`An optional path where to store raw swagger.json.`)
    public outFile?: string;
}