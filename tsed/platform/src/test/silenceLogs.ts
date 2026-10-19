import { vi, type MockInstance } from 'vitest';

/**
 * Swallows everything the logger (and anything else) writes to stdout / stderr.
 *
 * Call it in `beforeEach` BEFORE bootstrapping the server, and pair it with
 * `vi.restoreAllMocks()` in `afterEach`. Ts.ED's console appender writes through
 * `console._stdout` / `console._stderr`, which is why those streams are spied on
 * instead of `console.log`.
 *
 * Returns the spies so a test can still assert on what was written.
 */
export const silenceLogs = (): { stdout: MockInstance; stderr: MockInstance } => {
    const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

    return {
        stdout: vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true),
        stderr: vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true)
    };
};
