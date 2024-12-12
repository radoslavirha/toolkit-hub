import { PlatformExpress } from '@tsed/platform-express';
import { describe, expect, it } from 'vitest';
import { Platform } from './Platform.js';
import { ServerConfiguration } from './ServerConfiguration.js';

describe('Platform', () => {
    class Server {}
    
    describe('bootstrap()', () => {
        it('should create platform', async () => {
            const settings: ServerConfiguration = {
                api: {
                    service: 'test',
                    version: '0.0.1'
                }
            };

            const platform = await Platform.bootstrap(Server, settings);
    
            expect(platform.adapter).toBeInstanceOf(PlatformExpress);
        });
    });
});
