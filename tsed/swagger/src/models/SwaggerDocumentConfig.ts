import { AdditionalProperties, CollectionOf, Description, Example, Property, Required } from '@tsed/schema';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';

@AdditionalProperties(false)
@Description(`Configuration model for Swagger document/version.`)
export class SwaggerDocumentConfig {
    @Required()
    @Property(String)
    @Description(`Version of the document like v1. This version is used in the URL path to access the Swagger UI.
        The same value should be used in @Docs() decorator.`)
    @Example('v1')
    public docs: string;

    @CollectionOf(SwaggerSecurityScheme)
    @Description(`An array of used security schemes used in this document/version.
        Single value should be used in @Security() decorator.`)
    @Example([SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT])
    public security: SwaggerSecurityScheme[];

    @Property(String)
    @Description(`An optional path where to store raw swagger.json.`)
    public outFile?: string;
}