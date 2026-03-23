import { Configuration } from '@tsed/di';
import '@tsed/platform-express';

import { TestController } from './TestController.js';

/**
 * Minimal Ts.ED server for Logger integration tests.
 *
 * Intentionally does NOT extend BaseServer from @radoslavirha/tsed-platform to
 * avoid a circular dependency: services that use tsed-logger may also depend on
 * tsed-platform, and tsed-platform would then depend on tsed-logger.
 *
 * The Logger lifecycle hook `$onResponse` is triggered automatically by Ts.ED
 * on every @Injectable() provider that implements it — no wiring needed.
 */
@Configuration({
    mount: {
        '/': [TestController]
    }
})
export class TestServer {}

