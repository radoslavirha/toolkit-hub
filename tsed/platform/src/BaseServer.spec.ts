import { $log } from '@tsed/logger';
import { PlatformTest } from '@tsed/platform-http/testing';
import { describe, beforeEach, afterEach, expect, vi, it } from 'vitest';
import { BaseServer } from './BaseServer.js';

describe('ServerBase', () => {
    let server: BaseServer;

    beforeEach(PlatformTest.bootstrap(BaseServer));
    beforeEach(() => {
        server = PlatformTest.get<BaseServer>(BaseServer);
    });

    afterEach(PlatformTest.reset);

    it('$onReady', async () => {
        const spy = vi.spyOn($log, 'info').mockImplementation(vi.fn());

        server.$onReady();

        expect(spy).toBeCalledWith('test 0.0.1 is ready!');
    });

    it('registerMiddlewares', async () => {
        const logSpy = vi.spyOn($log, 'info').mockImplementation(vi.fn());
        // @ts-expect-error protected method
        const appSpy = vi.spyOn(server.app, 'use');

        // @ts-expect-error protected method
        server.registerMiddlewares();

        expect(logSpy).toHaveBeenCalledWith('Registering common middlewares...');
        expect(appSpy).toHaveBeenCalledTimes(6);
    });
});
