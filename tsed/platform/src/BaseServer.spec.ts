import { PlatformTest } from '@tsed/platform-http/testing';
import { Logger } from '@radoslavirha/tsed-logger';
import SuperTest from 'supertest';
import { describe, beforeEach, afterEach, expect, vi, it, MockInstance } from 'vitest';
import { TestController } from './test/TestController.js';
import { BaseServer } from './BaseServer.js';

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

describe('ServerBase', () => {
    let server: BaseServer;
    let loggerInfoSpy: MockInstance;

    // Must run BEFORE bootstrap so the $onReady lifecycle hook doesn't produce real output
    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
        loggerInfoSpy = vi.spyOn(Logger.prototype, 'info').mockImplementation(vi.fn());
    });

    beforeEach(PlatformTest.bootstrap(BaseServer, {
        mount: {
            '/': [TestController]
        }
    }));

    beforeEach(() => {
        loggerInfoSpy.mockClear();
        server = PlatformTest.get<BaseServer>(BaseServer);
    });

    afterEach(PlatformTest.reset);
    afterEach(() => vi.restoreAllMocks());

    it('$onReady', async () => {
        server.$onReady();

        expect(loggerInfoSpy).toHaveBeenCalledWith('test 0.0.1 is ready!');
    });

    it('registerMiddlewares', async () => {
        // @ts-expect-error protected method
        const appSpy = vi.spyOn(server.app, 'use');

        // @ts-expect-error protected method
        server.registerMiddlewares();

        expect(loggerInfoSpy).toHaveBeenCalledWith('Registering common middlewares...');
        expect(appSpy).toHaveBeenCalledTimes(6);
    });

    it('should register routes', async () => {
        const request = SuperTest.agent(PlatformTest.callback());

        // act
        const response = await request.get(`/`);

        // assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            test: 'This is a test',
            value: 12345
        });
    });
});
