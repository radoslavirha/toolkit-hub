import { PlatformExpress } from '@tsed/platform-express';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Platform } from './Platform.js';
import { ServerConfiguration } from './ServerConfiguration.js';
import { BaseServer } from './BaseServer.js';

const parseLogs = (spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] =>
    spy.mock.calls
        .flatMap(([chunk]) => {
            try {
                return [JSON.parse(String(chunk)) as Record<string, unknown>];
            } catch {
                return [];
            }
        });

describe('Platform', () => {
    let stdoutSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream };
        stdoutSpy = vi.spyOn(consoleLike._stdout, 'write')
            .mockImplementation(() => true);
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
    });
    describe('bootstrap()', () => {
        it('should create platform', async () => {
            const settings: ServerConfiguration = {
                api: {
                    service: 'test',
                    version: '0.0.1',
                    publicURL: 'http://localhost:3000/api'
                }
            };

            const platform = await Platform.bootstrap(BaseServer, settings);

            expect(platform.adapter).toBeInstanceOf(PlatformExpress);
            await platform.stop();
        });

        describe('with logger', () => {

            it('should create platform and listen', async () => {
                const settings: ServerConfiguration = {
                    api: {
                        service: 'test',
                        version: '0.0.1',
                        publicURL: 'http://localhost:3000/api'
                    },
                    logger: {
                        level: 'debug'
                    }
                };

                const platform = await Platform.bootstrap(BaseServer, settings);
                await platform.listen();

                const logs = parseLogs(stdoutSpy);
                expect(logs[0].message).toContain('Loading EXPRESS platform adapter');
                expect(logs[0].scope).toBe('TSED');
                
            });
        });
    });
});
