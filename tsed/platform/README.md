# @radoslavirha/tsed-platform

Ts.ED base platform utils.

## Installation

`pnpm add @radoslavirha/tsed-platform`

## Usage

```ts
// Server.ts
import { Configuration } from '@tsed/di';
import { BaseServer } from '@radoslavirha/tsed-platform';

export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }
}

```

```ts
// index.ts
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Server } from './Server.js';

try {
    const configuration: ServerConfiguration = {
        api: {
            service: 'service',
            version: '1.0.0'
        },
        httpPort: 4000
      };

    const platform = await PlatformExpress.Platform(Server, configuration);
    await platform.listen();
} catch (error) {
}
```
