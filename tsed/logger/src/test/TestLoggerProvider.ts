import { Injectable, ProviderScope } from '@tsed/di';

import { Logger } from '../Logger.js';
import { LoggerOptionsSchema } from '../RequestLogOptions.schema.js';
import type { LoggerOptions, LoggerOptionsInput } from '../RequestLogOptions.schema.js';

/**
 * Test-only `Logger` override for Logger integration tests.
 *
 * Demonstrates the `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` override
 * pattern documented in the package README. Options are set via the static `configure()`
 * method in each test's `beforeEach` BEFORE bootstrapping the platform — call `configure()`
 * again to reconfigure for a different scenario.
 *
 * Only this file references `LoggerProvider`-style overriding directly; everywhere else in
 * the test suite should just import and use `Logger` from `@radoslavirha/tsed-logger`.
 */
@Injectable({ token: Logger, scope: ProviderScope.SINGLETON })
export class TestLoggerProvider extends Logger {
    private static options: LoggerOptions = LoggerOptionsSchema.parse({
        enabled: false,
        requests: {
            enabled: false
        }
    });

    public static configure(opts: LoggerOptionsInput): void {
        TestLoggerProvider.options = LoggerOptionsSchema.parse(opts);
    }

    public constructor() {
        super(TestLoggerProvider.options);
    }
}
