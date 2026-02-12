# @radoslavirha/tsed-platform

> Pre-configured Express-based Ts.ED platform with standard middleware, base server class, and performance-tracked handler pattern for AI-assisted development.

Express-based Ts.ED platform adapter providing standardized bootstrap, base server with common middleware stack (CORS, compression, body parsing), and performance-tracked handler pattern for building microservices quickly.

## Installation

```bash
# Install with required peer dependencies
pnpm add @radoslavirha/tsed-platform @radoslavirha/tsed-configuration \
  @tsed/di @tsed/platform-express @tsed/platform-http @tsed/ajv @tsed/logger \
  body-parser compression cookie-parser cors method-override

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-platform @radoslavirha/tsed-configuration \
  @tsed/di @tsed/platform-express @tsed/platform-http @tsed/ajv @tsed/logger \
  body-parser compression cookie-parser cors method-override
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

## What's Included

### Core Components

- **`Platform`** - Platform bootstrap utility extending `PlatformExpress`
- **`BaseServer`** - Pre-configured Express server with common middleware
- **`BaseHandler<IRequest, IResponse>`** - Performance-tracked operation handler (abstract class)
- **`ServerConfiguration<T>`** - Type for Ts.ED server configuration with API metadata

## Architecture Pattern

This package provides a layered architecture for Ts.ED applications:

```
Platform.bootstrap(Server, config)
            ↓
    BaseServer (extends)
            ↓
    registerMiddlewares()
    → CORS, compression, body-parser, cookies
            ↓
      Controllers
            ↓
       BaseHandler
    → Performance tracking
    → Error handling
```

## Usage Guide

### Prerequisites

Before using this package, set up [@radoslavirha/tsed-configuration](../configuration/#4-create-configservice-recommended-pattern) with a `ConfigService` to provide API metadata and server settings.

### 1. Create Server Class

Extend `BaseServer` and call `registerMiddlewares()` in the `$beforeRoutesInit` lifecycle hook:

```typescript
// src/Server.ts
import { Configuration } from '@tsed/di';
import { BaseServer } from '@radoslavirha/tsed-platform';
import * as api from './controllers/index.js';

@Configuration({
    mount: {
        '/api': [...Object.values(api)]
    }
})
export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        // Register standard middleware stack
        this.registerMiddlewares();
    }
}
```

### 2. Bootstrap Platform

Use `Platform.bootstrap()` with your server and configuration:

```typescript
// src/index.ts
import { $log } from '@tsed/common';
import { injector } from '@tsed/di';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Server } from './Server';
import { ConfigService } from './config/ConfigService';

try {
    // Load configuration
    const config = injector().get<ConfigService>(ConfigService);

    // Create server configuration
    const configuration: ServerConfiguration = {
        ...config.server,
        api: config.api
    };

    // Bootstrap platform
    const platform = await Platform.bootstrap(Server, configuration);
    
    // Start listening
    await platform.listen();
} catch (error) {
    $log.error('Bootstrap failed:', error);
    process.exit(1);
}
```

**Key Points:**
- Use top-level try-catch (no async function wrapper)
- Access configuration via `injector().get<ConfigService>()`
- Spread `config.server` for Ts.ED settings (httpPort, etc.)
- Include `config.api` for service metadata

### 3. Create Handlers (Optional)

Use `BaseHandler` for business logic with automatic performance tracking:

```typescript
// src/handlers/Handler.ts
import { Injectable } from '@tsed/di';
import { BaseHandler } from '@radoslavirha/tsed-platform';

@Injectable()
export class Handler extends BaseHandler<Request, Response> {
    constructor(private service: Service) {}

    protected async performOperation(request: Request): Promise<Response> {
        // Business logic here
    }
}
```

### 4. Use Handler in Controller

Call `handler.execute()` from your controller endpoint:

```typescript
// src/controllers/Controller.ts
import { Controller } from '@tsed/di';
import { Post, Returns, BodyParams } from '@tsed/schema';
import { Handler } from '../handlers/Handler';

@Controller('/')
export class Controller {
    constructor(private handler: Handler) {}

    @Post('/')
    @Returns(201, Response)
    async post(@BodyParams(Request) request: Request): Promise<Response> {
        // execute() wraps performOperation() with timing and error handling
        return this.handler.execute(request);
    }
}
```

**Performance Logging:**
```
DEBUG Handler.execute() took +45.23 ms to execute!
```

## API Reference

### Platform

Express-based platform bootstrap utility extending Ts.ED's `PlatformExpress`.

**Static Method:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `bootstrap()` | `module: Type`, `settings: ServerConfiguration` | `Promise<PlatformExpress>` | Bootstrap Ts.ED application with Express |

**Example:**
```typescript
const platform = await Platform.bootstrap(Server, settings);
await platform.listen();
```

---

### ServerConfiguration<T>

Type definition for Ts.ED server configuration with required API metadata.

**Structure:**
```typescript
type ServerConfiguration<T extends object = {}> = {
    api: APIInformation;  // Required: service metadata
} & Partial<TsED.Configuration> & T;
```

**Required Property:**

| Property | Type | Description |
|----------|------|-------------|
| `api` | `APIInformation` | Service metadata (service name, version, description, publicURL) from ConfigService |

**Common Optional Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `httpPort` | `number` | HTTP server port |

---

### BaseServer

Pre-configured Express server class with standard middleware stack.

**Middleware Stack (via `registerMiddlewares()`):**

1. **CORS** - Cross-Origin Resource Sharing
   - `origin: true` - Allows all origins
   - `credentials: true` - Allows credentials (cookies, auth headers)
2. **cookie-parser** - Parse Cookie header and populate `req.cookies`
3. **compression** - gzip/deflate response compression
4. **method-override** - Override HTTP method via headers/query (`_method`)
5. **body-parser.json()** - Parse `application/json` request bodies
6. **body-parser.urlencoded()** - Parse `application/x-www-form-urlencoded` bodies (extended: true)

**Protected Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `app` | `Express.Application` | Express app instance for custom middleware |
| `settings` | `Configuration` | Ts.ED configuration (use `settings.get<T>(key)`) |

**Methods:**

| Method | Access | Description |
|--------|--------|-------------|
| `registerMiddlewares()` | `protected` | Register standard middleware stack (call in `$beforeRoutesInit`) |
| `$onReady()` | `public` | Lifecycle hook - logs service name/version when ready |

**Usage:**
```typescript
@Configuration({
    mount: {
        '/api': [...Object.values(api)]
    }
})
export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        // Register standard middlewares
        this.registerMiddlewares();
        
        // Add custom middleware after standard ones
    }
}
```

---

### BaseHandler<IRequest, IResponse>

Abstract handler class providing performance tracking and error handling wrapper for business logic.

**Type Parameters:**

| Parameter | Description |
|-----------|-------------|
| `IRequest` | Request/input type (optional, use `void` if not needed) |
| `IResponse` | Response/output type |

**Public Method:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `execute()` | `request?: IRequest`, `id?: string` | `Promise<IResponse>` | Execute handler with performance tracking and error handling |

**Abstract Method (must implement):**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `performOperation()` | `request?: IRequest`, `id?: string` | `Promise<IResponse>` | Implement your business logic here |

**Features:**
- ✅ Automatic performance timing (logs execution time in milliseconds)
- ✅ Centralized error logging with handler name context
- ✅ Type-safe request/response handling
- ✅ Optional ID parameter for resource operations or request tracing

**Logging Output:**

*Success (debug level):*
```
DEBUG Handler.execute() took +123.45 ms to execute!
```

*Error:*
```
ERROR Handler.execute() threw the following error: ValidationError: Invalid input
```

**Example without request (query pattern):**
```typescript
@Injectable()
export class Handler extends BaseHandler<void, Response> {
    constructor(private service: Service) {}

    protected async performOperation(): Promise<Response> {
    }
}
```

**Example with ID parameter (resource operations):**
```typescript
@Injectable()
export class Handler extends BaseHandler<Request, Response> {
    constructor(private service: Service) {}

    protected async performOperation(request: Request, id: string): Promise<Response> {
    }
}

// Usage in controller
@Put('/:id')
async update(
    @Required() @PathParams('id') id: string,
    @Required() @BodyParams(Request) request: Request
): Promise<Response> {
    return this.handler.execute(request, id);
}
```

## Complete Working Example

Full Ts.ED microservice using all platform components:

```typescript
// src/config/ConfigService.ts
import { Injectable } from '@tsed/di';
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
import { ConfigModel } from './ConfigModel';

@Injectable()
export class ConfigService extends ConfigProvider<ConfigModel> {
    public static readonly options: ConfigProviderOptions<ConfigModel> = {
        configModel: ConfigModel
    };

    constructor() {
        super(ConfigService.options);
    }
}
```

```typescript
// src/models/Request.ts
import { Property, Required } from '@tsed/schema';

export class Request {
    @Required()
    @Property()
    name: string;

    @Required()
    @Property()
    email: string;
}
```

```typescript
// src/models/Response.ts
import { Property, Required } from '@tsed/schema';

export class Response {
    @Required()
    @Property()
    id: string;

    @Required()
    @Property()
    name: string;

    @Required()
    @Property()
    email: string;

    @Property()
    createdAt: Date;
}
```

```typescript
// src/handlers/Handler.ts
import { Injectable } from '@tsed/di';
import { BaseHandler } from '@radoslavirha/tsed-platform';
import { BadRequest } from '@tsed/exceptions';
import { Request } from '../models/Request';
import { Response } from '../models/Response';

@Injectable()
export class Handler extends BaseHandler<Request, Response> {
    constructor(private service: Service) {}

    protected async performOperation(request: Request): Promise<Response> {
        // Business logic
        return this.service.create(request);
    }
}
```

```typescript
// src/controllers/Controller.ts
import { Controller, Inject } from '@tsed/di';
import { Post, Get, Returns, BodyParams, PathParams } from '@tsed/schema';
import { Handler } from '../handlers/Handler';
import { Request } from '../models/Request';
import { Response } from '../models/Response';

@Controller('/')
export class Controller {
    constructor(private handler: Handler) {}

    @Post('/')
    @Returns(201, Response)
    @Returns(400).Description('Bad request')
    async create(@BodyParams() request: Request): Promise<Response> {
        return this.handler.execute(request);
    }
}
```

```typescript
// src/Server.ts
import { Configuration } from '@tsed/di';
import { BaseServer } from '@radoslavirha/tsed-platform';
import * as api from './controllers/index.js';

@Configuration({
    mount: {
        '/api': [...Object.values(api)]
    }
})
export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }
}
```

```typescript
// src/index.ts
import { $log } from '@tsed/common';
import { injector } from '@tsed/di';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { Server } from './Server';
import { ConfigService } from './config/ConfigService';

try {
    // Load configuration
    const config = injector().get<ConfigService>(ConfigService);

    // Bootstrap platform
    const configuration: ServerConfiguration = {
        ...config.server,
        api: config.api
    };

    const platform = await Platform.bootstrap(Server, configuration);
    await platform.listen();
} catch (error) {
    $log.error('Bootstrap failed:', error);
    process.exit(1);
}
```

## Integration with Other Packages

### With @radoslavirha/tsed-configuration

Platform requires ConfigService for API metadata and server configuration:

```typescript
import { injector } from '@tsed/di';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { ConfigService } from '@radoslavirha/tsed-configuration';

const config = injector().get<ConfigService>(ConfigService);

const configuration: ServerConfiguration = {
    ...config.server,  // httpPort, httpsPort, etc.
    api: config.api    // service, version, description, publicURL
};

const platform = await Platform.bootstrap(Server, configuration);
```

### With @radoslavirha/tsed-swagger

Add Swagger documentation to your platform:

```typescript
import { SwaggerProvider, SwaggerConfig } from '@radoslavirha/tsed-swagger';

const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: config.api.service,
    version: config.api.version,
    documents: [/* ... */]
});

const swaggerProvider = new SwaggerProvider(swaggerConfig);

const configuration: ServerConfiguration = {
    ...config.server,
    api: config.api,
    swagger: swaggerProvider.config  // Add Swagger settings
};
```

See [@radoslavirha/tsed-swagger README](../swagger/) for full Swagger integration.

## When to Use

✅ **Use this package when:**
- Building Ts.ED microservices with Express
- Need standardized middleware stack (CORS, compression, body parsing)
- Want consistent handler pattern with performance tracking
- Building multiple microservices with common patterns

❌ **Don't use when:**
- Using different HTTP framework (Koa, Fastify, Hapi)
- Building serverless functions (AWS Lambda, Azure Functions)

## Best Practices

1. **Always call `registerMiddlewares()`** in `$beforeRoutesInit` to ensure middleware is registered before routes
2. **Use ConfigService** from @radoslavirha/tsed-configuration for consistent configuration management
3. **Use BaseHandler** for business logic to separate HTTP concerns from business logic
4. **Use top-level try-catch** in index.ts (no async function wrapper) to match Ts.ED patterns
5. **Access Express app** via `this.app` in BaseServer for custom middleware

## Related Packages

- [@radoslavirha/tsed-configuration](../configuration/) - Provides configuration and APIInformation
- [@radoslavirha/tsed-swagger](../swagger/) - API documentation
