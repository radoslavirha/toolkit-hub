import { BaseConfigProvider } from '@radoslavirha/tsed-configuration';
import { OS3Security, OpenSpec3, OpenSpecHash, OpenSpecInfo } from '@tsed/openspec';
import { SwaggerSettings } from '@tsed/swagger';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';
import { SwaggerConfig } from '../models/SwaggerConfig.js';
import { SwaggerDocumentConfig } from '../models/SwaggerDocumentConfig.js';
import { SWAGGER_SECURITY_SCHEMES } from '../SwaggerSecuritySchemes.js';
import { serialize } from '@tsed/json-mapper';
import { SwaggerUIConfig } from '../models/SwaggerUIConfig.js';

export class SwaggerProvider extends BaseConfigProvider<SwaggerSettings[]> {
    constructor(config: SwaggerConfig) {
        super(config.documents.map((docsVersion) => SwaggerProvider.generateSettings(config, docsVersion)));
    }

    private static generateSettings(config: SwaggerConfig, settings: SwaggerDocumentConfig): SwaggerSettings {
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
            options: serialize(config.swaggerUIOptions, { type: SwaggerUIConfig })
        };
    }

    private static getSecuritySchemes(security: SwaggerSecurityScheme[]): OpenSpecHash<OS3Security> {
        const schemes: OpenSpecHash<OS3Security> = {};

        for (const scheme of security) {
            schemes[scheme] = SWAGGER_SECURITY_SCHEMES[scheme];
        }

        return schemes;
    }
}
