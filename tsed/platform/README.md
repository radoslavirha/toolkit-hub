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

BaseHandler just tracks handler performance using logger debug and error events. It's important to call `execute()` method (in controller) which calls `performOperation()` automatically.

```ts
// handler.ts
import { Controller, Injectable } from '@tsed/di';
import { Get, Returns } from '@tsed/schema';
import { BaseHandler } from '@radoslavirha/tsed-platform';

@Injectable()
export class MyHandler extends BaseHandler<IRequest, IResponse> {
  constructor() {
    super();
  }

  async performOperation(request: IRequest): Promise<IResponse> {
    ...
    return response;
  }
}

@Controller('/')
export class MyController {
  constructor(
    private handler: MyHandler
  ) {}

  @Get('/path')
  @Returns(200, IResponse)
  get(@BodyParams() body: IRequest): Promise<IResponse> {
    return this.handler.execute(body);
  }
}
```
