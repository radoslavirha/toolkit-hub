import { PlatformTest } from '@tsed/platform-http/testing';
import { Configuration } from '@tsed/di';
import SuperTest from 'supertest';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { BaseServer } from './BaseServer.js';
import { TestController } from './test/TestController.js';

// Server written as the using-tsed-platform skill instructs:
// "To add your own, override that method and call super" — no $beforeRoutesInit.
@Configuration({ mount: { '/': [TestController] } })
class SkillServer extends BaseServer {
    protected registerMiddlewares(): void {
        super.registerMiddlewares();
        this.app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
            res.setHeader('x-custom', 'yes');
            next();
        });
    }
}

describe('BaseServer registerMiddlewares override', () => {
    beforeEach(PlatformTest.bootstrap(SkillServer));
    afterEach(PlatformTest.reset);

    it('runs without an explicit $beforeRoutesInit', async () => {
        const res = await SuperTest(PlatformTest.callback()).get('/');
        expect(res.status).toBe(200);
        expect(res.headers['x-custom']).toBe('yes');
    });
});
