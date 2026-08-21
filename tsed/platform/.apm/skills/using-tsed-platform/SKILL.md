---
name: using-tsed-platform
description: Use when bootstrapping a Ts.ED service, writing a Server class, adding Express middleware, mounting controllers, or writing a handler that a controller delegates to. Covers Platform.bootstrap, extending BaseServer, the BaseHandler execute/performOperation split, and the mount and constructor mistakes that break dependency injection.
---

# Using @radoslavirha/tsed-platform

The package supplies four things: `Platform` (bootstrap), `BaseServer` (middleware stack and
lifecycle), `BaseHandler` (the unit a controller delegates to), and `ServerConfiguration`
(the settings type).

## Bootstrap

```ts ignore
const configuration: ServerConfiguration = {
    rootModule: Server,
    ...config.server,
    api: config.api
};

const platform = await Platform.bootstrap(configuration);
await platform.listen();
```

`bootstrap` takes settings only — the server class travels in them as `rootModule`, the shape
Ts.ED 8.38 documents. `Platform` is a plain wrapper, not a `PlatformExpress` subclass.

`ServerConfiguration` is Ts.ED's configuration plus a **required** `api` property carrying
`APIInformation` (service, version, description, publicURL). It is generic over your own
settings, so service-specific configuration stays typed rather than cast.

## The Server

Extend `BaseServer` and configure it with `@Configuration`. `BaseServer` already registers
the standard Express stack — body parser, cookie parser, compression, method override, CORS —
in `registerMiddlewares()`. To add your own, override that method and call `super`; do not
rebuild the stack from scratch.

**Mount controllers by value, never by glob.** A glob is resolved at runtime against paths
that differ between `src` and `dist`, so it works in development and silently mounts nothing
after a build:

```ts ignore
// wrong — path depends on runtime layout
@Configuration({ mount: { '/api': [`${__dirname}/controllers/**/*.ts`] } })

// right — the compiler sees the controllers
import * as controllers from './controllers/index.js';
@Configuration({ mount: { '/api': [...Object.values(controllers)] } })
```

## Handlers

`BaseHandler<IRequest, IResponse>` splits the public entry point from the work:

- **You implement** `protected performOperation(request?, id?): Promise<IResponse>`
- **Callers use** `public execute(request?, id?)`, which times the call, logs at debug level,
  and re-throws after logging with handler context

So a controller stays thin — validate and delegate. The handler side is the part with a
contract to keep:

```ts
import { Injectable } from '@tsed/di';
import { Property } from '@tsed/schema';
import { BaseHandler } from '@radoslavirha/tsed-platform';

class ItemRequest {
    @Property() name!: string;
}

class ItemResponse {
    @Property() id!: string;
}

@Injectable()
export class ItemHandler extends BaseHandler<ItemRequest, ItemResponse> {
    protected async performOperation(request?: ItemRequest, id?: string): Promise<ItemResponse> {
        return { id: `${id}-${request?.name ?? ''}` };
    }
}
```

and the controller delegates to `execute`:

```ts ignore
@Controller('/items')
export class ItemController {
    constructor(private handler: ItemHandler) {}

    @Post('/:id')
    async handle(
        @Required() @PathParams('id') id: string,
        @Required() @BodyParams(ItemRequest) request: ItemRequest
    ): Promise<ItemResponse> {
        return this.handler.execute(request, id);
    }
}
```

Never call `performOperation` directly from a controller — that skips the timing, logging and
error handling that are the reason the base class exists.

**`BaseHandler` takes no constructor arguments.** Declare a constructor only to receive
injected dependencies, and still call `super()`:

```ts ignore
// wrong — implies the base needs arguments
constructor() { super(); }

// right — inject what the handler needs
constructor(private service: ItemService) { super(); }
```

## Configuration access

Resolve the configuration service once, at bootstrap, through the injector; inject it
everywhere else. Constructing it directly produces a second instance with its own state:

```ts ignore
// wrong
const config = new ConfigService();

// right — at bootstrap
const config = injector().get<ConfigService>(ConfigService);
// right — everywhere else
constructor(private config: ConfigService) {}
```

## Logging

`BaseServer` wires Ts.ED's logger to the toolkit logger through `TsEDLoggerBridge`. Inject
`Logger` and call `logger.child('SCOPE')` rather than configuring transports yourself; the
scope convention is `SUBSYSTEM` or `SUBSYSTEM:instance`.
