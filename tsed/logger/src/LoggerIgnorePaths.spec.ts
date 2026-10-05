import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { runInContext } from '@tsed/di';
import type { PlatformContext } from '@tsed/platform-http';
import { PlatformTest } from '@tsed/platform-http/testing';

import { LoggerOptionsSchema } from './RequestLogOptions.schema.js';
import type { LoggerOptionsInput } from './RequestLogOptions.schema.js';
import { Logger } from './Logger.js';

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

type LoggerInternal = {
    $onResponse: ($ctx: PlatformContext) => void;
    httpLog: { info: (message: string, attributes: Record<string, unknown>) => void };
};

const respond = (logger: LoggerInternal, ctx: PlatformContext): Promise<void> =>
    runInContext(ctx, () => logger.$onResponse(ctx));

const buildLogger = (opts: LoggerOptionsInput = {}): LoggerInternal =>
    new Logger(LoggerOptionsSchema.parse(opts)) as unknown as LoggerInternal;

describe('Logger', () => {
    let $ctx: PlatformContext;

    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
        $ctx = PlatformTest.createRequestContext();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await $ctx.destroy();
    });

    describe('ignorePaths with a trailing slash', () => {
        const run = async (ignorePaths: string[], url: string): Promise<boolean> => {
            const logger = buildLogger({ requests: { enabled: true, ignorePaths } });
            const infoSpy = vi.spyOn(logger.httpLog, 'info');
            $ctx.data = { ok: true };
            $ctx.request.raw.url = url;

            await respond(logger, $ctx);

            return infoSpy.mock.calls.length > 0;
        };

        it('suppresses paths under an entry written with a trailing slash', async () => {
            expect(await run(['/metrics/'], '/metrics/prometheus')).toBe(false);
        });

        it('suppresses the entry path itself and keeps the segment boundary', async () => {
            expect(await run(['/metrics/'], '/metrics')).toBe(false);
            expect(await run(['/metrics/'], '/metrics-admin')).toBe(true);
        });

        it('treats "/" as matching every path', async () => {
            expect(await run(['/'], '/anything/here')).toBe(false);
            expect(await run(['/'], '/')).toBe(false);
        });
    });
});
