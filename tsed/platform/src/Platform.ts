import { Type } from '@tsed/core';
import { PlatformExpress } from '@tsed/platform-express';
import { ServerConfiguration } from './ServerConfiguration.js';

export class Platform extends PlatformExpress {
    static bootstrap(module: Type, settings: ServerConfiguration) {
        return PlatformExpress.bootstrap(module, settings);
    }
}
