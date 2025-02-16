import { BaseServer, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { PlatformTest } from '@tsed/platform-http/testing';
import { minify } from 'html-minifier';
import SuperTest from 'supertest';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { SwaggerController } from './SwaggerController.js';

describe('SwaggerController', () => {
    let request: SuperTest.Agent;

    beforeEach(
        PlatformTest.bootstrap(BaseServer, <ServerConfiguration>{
            mount: {
                '/': [SwaggerController]
            },
            swagger: [
                {
                    path: '/v1/docs',
                    doc: 'v1',
                    specVersion: '3.0.3',
                    spec: {
                        info: {
                            title: 'My API - v1',
                            version: '1.0.0',
                            description: 'This is a description of the application.'
                        }
                    }
                },
                {
                    path: '/v2/docs',
                    doc: 'v2',
                    specVersion: '3.0.3',
                    spec: {
                        info: {
                            title: 'My API - v2',
                            version: '1.0.0',
                            description: 'This is a description of the application.'
                        }
                    }
                }
            ],
            api: {
                service: 'My API',
                version: '1.0.0',
                description: 'This is a description of the application.'
            }
        })
    );
    beforeEach(() => {
        request = SuperTest(PlatformTest.callback());
    });
    afterEach(PlatformTest.reset);

    it('Should call GET /', async () => {
        const response = await request.get('/');

        const minified = minify(response.text, { collapseWhitespace: true });

        expect(minified).toContain(`<title>My API 1.0.0</title>`);
        expect(minified).toContain(`<h1>My API 1.0.0</h1>`);
        expect(minified).toContain(`/v1/docs"><span>API v1</span> <span>OpenSpec 3.0.3</span></a></li>`);
        expect(minified).toContain(`/v2/docs"><span>API v2</span> <span>OpenSpec 3.0.3</span></a></li>`);
        expect(response.status).toEqual(200);
    });
});
