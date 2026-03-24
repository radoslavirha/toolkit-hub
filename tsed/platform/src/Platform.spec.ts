import { PlatformExpress } from '@tsed/platform-express';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Platform } from './Platform.js';
import { ServerConfiguration } from './ServerConfiguration.js';

const consoleLike = console as unknown as { _stdout: NodeJS.WriteStream; _stderr: NodeJS.WriteStream };

describe('Platform', () => {
    class Server {}

    beforeEach(() => {
        vi.spyOn(consoleLike._stdout, 'write').mockImplementation(() => true);
        vi.spyOn(consoleLike._stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
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

            const platform = await Platform.bootstrap(Server, settings);
    
            expect(platform.adapter).toBeInstanceOf(PlatformExpress);
        });
    });
});
