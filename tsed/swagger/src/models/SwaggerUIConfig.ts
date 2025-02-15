import { AdditionalProperties, Description } from '@tsed/schema';
import { SwaggerUIOptions } from '@tsed/swagger';

@AdditionalProperties(true)
@Description(`Configuration of the Swagger UI options. This configuration is directly passed to the Swagger UI library.`)
export class SwaggerUIConfig implements SwaggerUIOptions {
    [key: string]: unknown;
}
