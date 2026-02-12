import { OS3Security } from '@tsed/openspec';
import { EnumDictionary } from '@radoslavirha/types';
import { SwaggerSecurityScheme } from './enums/SwaggerSecurityScheme.enum.js';

/**
 * Dictionary mapping {@link SwaggerSecurityScheme} enum values to their corresponding
 * OpenAPI 3.0 security scheme definitions.
 * 
 * This constant provides the actual OpenAPI security scheme configurations that will be
 * included in the generated Swagger documentation under `components.securitySchemes`.
 * 
 * Each security scheme follows the OpenAPI 3.0 Security Scheme Object specification:
 * - **BEARER_JWT**: HTTP Bearer authentication with JWT token format
 * - **BASIC**: HTTP Basic authentication with username/password
 * 
 * @example
 * ```typescript
 * // Access a specific scheme definition
 * const jwtScheme = SWAGGER_SECURITY_SCHEMES[SwaggerSecurityScheme.BEARER_JWT];
 * // Returns: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', ... }
 * 
 * // Used internally by SwaggerProvider to build OpenAPI spec
 * const securitySchemes = {};
 * for (const scheme of [SwaggerSecurityScheme.BEARER_JWT]) {
 *     securitySchemes[scheme] = SWAGGER_SECURITY_SCHEMES[scheme];
 * }
 * ```
 * 
 * @see {@link SwaggerSecurityScheme} - Enum defining available security schemes
 * @see {@link SwaggerProvider} - Uses this dictionary to generate security schemes
 * @see https://swagger.io/specification/#security-scheme-object - OpenAPI 3.0 Security Scheme Object spec
 */
export const SWAGGER_SECURITY_SCHEMES: EnumDictionary<SwaggerSecurityScheme, OS3Security> = {
    [SwaggerSecurityScheme.BEARER_JWT]: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer JWT token'
    },
    [SwaggerSecurityScheme.BASIC]: {
        type: 'http',
        scheme: 'basic',
        description: 'Basic authentication'
    }
};