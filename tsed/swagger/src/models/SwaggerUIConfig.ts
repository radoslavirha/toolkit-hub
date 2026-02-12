import { AdditionalProperties, Description } from '@tsed/schema';
import { SwaggerUIOptions } from '@tsed/swagger';

/**
 * Configuration model for Swagger UI options that are passed directly to the Swagger UI library.
 * 
 * This class implements {@link SwaggerUIOptions} and allows additional properties to be set
 * for configuring the Swagger UI interface appearance and behavior. All standard Swagger UI
 * configuration options are supported.
 * 
 * Common options include:
 * - `validatorUrl`: URL to validate Swagger spec (set to `null` to disable)
 * - `urls`: Array of API definition URLs (auto-configured if `serverUrl` is provided in {@link SwaggerConfig})
 * - `deepLinking`: Enable deep linking for tags and operations
 * - `displayOperationId`: Display operationId in operations list
 * - `defaultModelsExpandDepth`: Default expansion depth for models
 * - `filter`: Enable filtering of operations by tags
 * - `syntaxHighlight`: Syntax highlighting theme configuration
 * - `tryItOutEnabled`: Enable "Try it out" feature
 * 
 * @example
 * ```typescript
 * import { CommonUtils } from '@radoslavirha/utils';
 * 
 * const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
 *     title: 'My API',
 *     version: '1.0.0',
 *     description: 'API description',
 *     documents: [...],
 *     swaggerUIOptions: {
 *         validatorUrl: null,
 *         deepLinking: true,
 *         displayOperationId: true,
 *         filter: true,
 *         tryItOutEnabled: true
 *     }
 * });
 * ```
 * 
 * @see {@link SwaggerConfig.swaggerUIOptions} - Used as property in SwaggerConfig
 * @see https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/ - Swagger UI configuration options
 */
@AdditionalProperties(true)
@Description(`Configuration of the Swagger UI options. This configuration is directly passed to the Swagger UI library.`)
export class SwaggerUIConfig implements SwaggerUIOptions {
    [key: string]: unknown;
}
