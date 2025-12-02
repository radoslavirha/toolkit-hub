import { CommonUtils } from '@radoslavirha/utils';
import { AdditionalProperties, CollectionOf, Description, Example, Property, Required } from '@tsed/schema';
import { SwaggerUIConfig } from './SwaggerUIConfig.js';
import { SwaggerDocumentConfig } from './SwaggerDocumentConfig.js';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';

@AdditionalProperties(false)
@Description(`Configuration of the Swagger module for building Swagger UI pages.`)
export class SwaggerConfig {
    @Required()
    @Property(String)
    @Description(`Title/application name for the Swagger UI page.`)
    @Example('My API')
    public title: string;

    @Required()
    @Property(String)
    @Description(`Application name for the Swagger UI page.`)
    @Example('1.0.0')
    public version: string;

    @Required()
    @Property(String)
    @Description(`Application description for the Swagger UI page.`)
    @Example('This is a description of the application.')
    public description: string;

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

    @Property(SwaggerUIConfig)
    @Description(`Configuration options for Swagger UI.`)
    public swaggerUIOptions: SwaggerUIConfig = {};

    @Property(String)
    @Description('Server URL to be used in the Swagger documentation including any proxy removed paths. Automatically sets urls in Swagger UI config.')
    public serverUrl?: string;
}