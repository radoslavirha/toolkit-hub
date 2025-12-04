import { Type } from '@tsed/core';
import { PlatformExpress } from '@tsed/platform-express';
import { ServerConfiguration } from './ServerConfiguration.js';

export class Platform extends PlatformExpress {
    static bootstrap(module: Type, settings: ServerConfiguration): ReturnType<typeof PlatformExpress.bootstrap> {
        return PlatformExpress.bootstrap(module, settings);
    }
}
