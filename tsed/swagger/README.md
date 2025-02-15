# @radoslavirha/tsed-swagger

Ts.ED swagger utils.

## Installation

`pnpm add @radoslavirha/tsed-swagger`

## Usage

SwaggerProvider just builds swagger configuration for you based on few instructions like documents/versions you want to maintain and basic API info.

SwaggerDocumentConfig.docs should match value you use in @Docs() decorator.

SwaggerDocumentConfig.security should contain all security schemes you use in @Security() decorator for current document/versions.

```ts
// index.ts
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { SwaggerConfig, SwaggerDocumentConfig, SwaggerProvider, SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';
import { Server } from './Server.js';

try {
    const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
        title: 'My API',
        version: '1.0.0',
        description: 'This is a description of the application.',
        documents: [
            CommonUtils.buildModel(SwaggerDocumentConfig, {
                docs: 'v1',
                security: [SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT]
            })
        ]
    });

    const configuration: ServerConfiguration = {
        ...,
        swagger: new SwaggerProvider(swaggerConfig).config
      };

    const platform = await PlatformExpress.Platform(Server, configuration);
    await platform.listen();
} catch (error) {
}
```

```ts
// controller.ts
import { Controller, Injectable } from '@tsed/di';
import { Docs } from '@tsed/swagger';
import { Get, Returns, Security } from '@tsed/schema';

@Controller('/')
@Docs('v1')
export class MyController {
  constructor(
    private handler: MyHandler
  ) {}

  @Get('/restricted')
  @Returns(200)
  @Security(SwaggerSecurityScheme.BEARER_JWT)
  get(): Promise<void> {
    return;
  }
}
```

Swagger controller usage. You need to copy view also ...to be described

```ts
// Server.ts
import { SwaggerController } from '@radoslavirha/tsed-swagger';

@Configuration({
  mount: {
    '/': [SwaggerController]
  },
  views: {
    root: join(process.cwd(), '../views'),
    extensions: {
      ejs: 'ejs'
    }
  }
})
export class Server extends BaseServer {
}
```
