import '@tsed/swagger';
import { BaseServer, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { CommonUtils } from '@radoslavirha/utils';
import { PlatformTest } from '@tsed/platform-http/testing';
import SuperTest from 'supertest';
import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SwaggerConfig } from '../models/SwaggerConfig.js';
import { SwaggerDocumentConfig } from '../models/SwaggerDocumentConfig.js';
import { SwaggerUIConfig } from '../models/SwaggerUIConfig.js';
import { SwaggerProvider } from './SwaggerProvider.js';

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

describe('SwaggerProvider', () => {
    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
    });

    afterEach(PlatformTest.reset);
    afterEach(() => vi.restoreAllMocks());

    it('Should publish serverUrl as the spec server so Try it out keeps the proxy path', async () => {
        const provider = new SwaggerProvider(CommonUtils.buildModelStrict(SwaggerConfig, {
            title: 'My API',
            version: '1.0.0',
            description: 'Behind a path-prefix proxy',
            serverUrl: 'https://api.example.com/path',
            documents: [CommonUtils.buildModelStrict(SwaggerDocumentConfig, { docs: 'v1', security: [] })],
            swaggerUIOptions: CommonUtils.buildModelStrict(SwaggerUIConfig, {})
        }));

        await PlatformTest.bootstrap(BaseServer, <ServerConfiguration>{
            swagger: provider.config,
            api: { service: 'My API', version: '1.0.0' }
        })();
        const request = SuperTest(PlatformTest.callback());

        const response = await request.get('/v1/docs/swagger.json');

        expect(response.status).toStrictEqual(200);
        expect(response.body.servers).toStrictEqual([{ url: 'https://api.example.com/path' }]);
    });
});
