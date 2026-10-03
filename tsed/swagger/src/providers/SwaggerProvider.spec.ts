import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { PlatformTest } from '@tsed/platform-http/testing';
import { CommonUtils } from '@radoslavirha/utils';
import { deserialize } from '@tsed/json-mapper';
import { SwaggerConfig } from '../models/SwaggerConfig.js';
import { SwaggerDocumentConfig } from '../models/SwaggerDocumentConfig.js';
import { SwaggerSecurityScheme } from '../enums/SwaggerSecurityScheme.enum.js';
import { SwaggerUIConfig } from '../models/SwaggerUIConfig.js';
import { SwaggerProvider } from './SwaggerProvider.js';

describe('SwaggerProvider', () => {

    beforeEach(PlatformTest.create);
    afterEach(PlatformTest.reset);

    it('Should build swagger configuration', async () => {
        const configuration = CommonUtils.buildModelStrict(SwaggerConfig, {
            title: 'My API',
            version: '1.0.0',
            description: 'This is a description of the application.',
            documents: [
                CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
                    docs: 'v1',
                    security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT],
                    outFile: 'path1'
                }),
                CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
                    docs: 'v2',
                    security: [SwaggerSecurityScheme.BASIC]
                })
            ],
            swaggerUIOptions: CommonUtils.buildModelStrict(SwaggerUIConfig, {})
        });
        const provider = new SwaggerProvider(configuration);

        expect(provider.config).toStrictEqual([
            {
                path: '/v1/docs',
                doc: 'v1',
                specVersion: '3.0.3',
                outFile: 'path1',
                spec: {
                    info: {
                        title: 'My API - v1',
                        version: '1.0.0',
                        description: 'This is a description of the application.'
                    },
                    components: {
                        securitySchemes: {
                            [SwaggerSecurityScheme.BASIC]: {
                                type: 'http',
                                scheme: 'basic',
                                description: 'Basic authentication'
                            },
                            [SwaggerSecurityScheme.BEARER_JWT]: {
                                type: 'http',
                                scheme: 'bearer',
                                bearerFormat: 'JWT',
                                description: 'Bearer JWT token'
                            }
                        }
                    }
                },
                options: {}
            },
            {
                path: '/v2/docs',
                doc: 'v2',
                specVersion: '3.0.3',
                outFile: undefined,
                spec: {
                    info: {
                        title: 'My API - v2',
                        version: '1.0.0',
                        description: 'This is a description of the application.'
                    },
                    components: {
                        securitySchemes: {
                            [SwaggerSecurityScheme.BASIC]: {
                                type: 'http',
                                scheme: 'basic',
                                description: 'Basic authentication'
                            }
                        }
                    }
                },
                options: {}
            }
        ]);
    });
    it('Should build swagger configuration with serverUrl', async () => {
        const configuration = CommonUtils.buildModelStrict(SwaggerConfig, {
            title: 'My API',
            version: '1.0.0',
            description: 'This is a description of the application.',
            documents: [
                CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
                    docs: 'v1',
                    security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT],
                    outFile: 'path1'
                })
            ],
            swaggerUIOptions: CommonUtils.buildModelStrict(SwaggerUIConfig, {}),
            serverUrl: 'https://api.example.com/path'
        });
        const provider = new SwaggerProvider(configuration);

        expect(provider.config).toStrictEqual([
            {
                path: '/v1/docs',
                doc: 'v1',
                specVersion: '3.0.3',
                outFile: 'path1',
                spec: {
                    info: {
                        title: 'My API - v1',
                        version: '1.0.0',
                        description: 'This is a description of the application.'
                    },
                    components: {
                        securitySchemes: {
                            [SwaggerSecurityScheme.BASIC]: {
                                type: 'http',
                                scheme: 'basic',
                                description: 'Basic authentication'
                            },
                            [SwaggerSecurityScheme.BEARER_JWT]: {
                                type: 'http',
                                scheme: 'bearer',
                                bearerFormat: 'JWT',
                                description: 'Bearer JWT token'
                            }
                        }
                    }
                },
                options: {
                    urls: [
                        {
                            name: 'v1',
                            url: 'https://api.example.com/path/v1/docs/swagger.json'
                        }
                    ]
                }
            }
        ]);
    });
    it('Should not produce a double slash when serverUrl ends with a slash', () => {
        const configuration = CommonUtils.buildModelStrict(SwaggerConfig, {
            title: 'My API',
            version: '1.0.0',
            description: 'Description',
            serverUrl: 'https://api.example.com/path/',
            documents: [CommonUtils.buildModelStrict(SwaggerDocumentConfig, { docs: 'v1', security: [] })],
            swaggerUIOptions: CommonUtils.buildModelStrict(SwaggerUIConfig, {})
        });

        const provider = new SwaggerProvider(configuration);

        expect(provider.config[0].options?.urls).toStrictEqual([
            { name: 'v1', url: 'https://api.example.com/path/v1/docs/swagger.json' }
        ]);
    });
    it('Should build settings for a document without security schemes', () => {
        const configuration = deserialize<SwaggerConfig>({
            title: 'My API',
            version: '1.0.0',
            description: 'Public API',
            documents: [{ docs: 'v1' }]
        }, { type: SwaggerConfig });

        const provider = new SwaggerProvider(configuration);

        expect(provider.config[0].spec).toStrictEqual({
            info: { title: 'My API - v1', version: '1.0.0', description: 'Public API' },
            components: { securitySchemes: {} }
        });
    });
});
