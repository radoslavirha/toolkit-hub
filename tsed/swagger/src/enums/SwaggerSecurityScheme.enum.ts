/**
 * Enumeration of supported Swagger security schemes for API authentication.
 * 
 * These schemes are used to configure OpenAPI security definitions and can be applied
 * to Swagger document versions via {@link SwaggerDocumentConfig.security}.
 * Each scheme maps to a specific OpenAPI 3.0 security scheme definition in {@link SWAGGER_SECURITY_SCHEMES}.
 * 
 * @example
 * ```typescript
 * // Use in SwaggerDocumentConfig
 * const docConfig = CommonUtils.buildModel(SwaggerDocumentConfig, {
 *     docs: 'v1',
 *     security: [SwaggerSecurityScheme.BEARER_JWT]
 * });
 * 
 * // Apply to specific endpoints with @Security decorator
 * import { Security } from '@tsed/schema';
 * 
 * @Security(SwaggerSecurityScheme.BEARER_JWT)
 * @Get('/protected')
 * async getProtectedResource() {
 *     // ...
 * }
 * ```
 * 
 * @see {@link SwaggerDocumentConfig.security} - Configure security schemes for a document version
 * @see {@link SWAGGER_SECURITY_SCHEMES} - OpenAPI 3.0 security scheme definitions
 */
export enum SwaggerSecurityScheme {
    /**
     * HTTP Basic authentication scheme.
     * 
     * Requires username and password credentials sent via Authorization header
     * using the Basic authentication scheme (base64 encoded).
     * 
     * Maps to OpenAPI security scheme:
     * ```json
     * {
     *   "type": "http",
     *   "scheme": "basic",
     *   "description": "Basic authentication"
     * }
     * ```
     */
    BASIC = 'BASIC',
    
    /**
     * HTTP Bearer authentication with JWT tokens.
     * 
     * Requires a JWT token sent via Authorization header using the Bearer scheme.
     * The token should be sent as: `Authorization: Bearer <token>`
     * 
     * Maps to OpenAPI security scheme:
     * ```json
     * {
     *   "type": "http",
     *   "scheme": "bearer",
     *   "bearerFormat": "JWT",
     *   "description": "Bearer JWT token"
     * }
     * ```
     */
    BEARER_JWT = 'BEARER_JWT'
}