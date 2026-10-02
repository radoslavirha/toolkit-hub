import { PlatformTest } from '@tsed/platform-http/testing';
import { Logger } from '@radoslavirha/tsed-logger';
import SuperTest from 'supertest';
import { describe, beforeEach, afterEach, expect, vi, it, MockInstance } from 'vitest';
import { TestController } from './test/TestController.js';
import { BaseServer } from './BaseServer.js';

class MiddlewareServer extends BaseServer {
    public $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }
}

class CustomMiddlewareServer extends BaseServer {
    protected registerMiddlewares(): void {
        super.registerMiddlewares();
        this.app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
            res.setHeader('x-custom', 'yes');
            next();
        });
    }
}

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
        expect(appSpy).toHaveBeenCalledTimes(4);
    });

    it('should register routes', async () => {
        const request = SuperTest.agent(PlatformTest.callback());

        // act
        const response = await request.get(`/`);

        // assert
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            test: 'This is a test',
            value: 12345
        });
    });
});

describe('ServerBase middleware stack', () => {
    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
        vi.spyOn(Logger.prototype, 'info').mockImplementation(vi.fn());
    });

    beforeEach(PlatformTest.bootstrap(MiddlewareServer, {
        mount: {
            '/': [TestController]
        }
    }));

    afterEach(PlatformTest.reset);
    afterEach(() => vi.restoreAllMocks());

    it('does not emit CORS headers', async () => {
        const response = await SuperTest(PlatformTest.callback()).get('/').set('Origin', 'https://evil.example');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
        expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('does not honour X-HTTP-Method-Override', async () => {
        const response = await SuperTest(PlatformTest.callback()).post('/').set('X-HTTP-Method-Override', 'GET');

        // POST / has no handler; had the override been applied it would have routed to GET / (200)
        expect(response.status).toBe(404);
    });
});

describe('ServerBase registerMiddlewares override', () => {
    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
        vi.spyOn(Logger.prototype, 'info').mockImplementation(vi.fn());
    });

    beforeEach(PlatformTest.bootstrap(CustomMiddlewareServer, {
        mount: {
            '/': [TestController]
        }
    }));

    afterEach(PlatformTest.reset);
    afterEach(() => vi.restoreAllMocks());

    it('runs the override without an explicit $beforeRoutesInit', async () => {
        const response = await SuperTest(PlatformTest.callback()).get('/');

        expect(response.status).toBe(200);
        expect(response.headers['x-custom']).toBe('yes');
    });
});
