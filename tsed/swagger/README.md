# @radoslavirha/tsed-swagger

Automated OpenAPI/Swagger documentation for Ts.ED applications with multi-version support, custom branding, and security scheme configuration. This package provides a declarative configuration approach for setting up Swagger UI with versioned API documentation, pre-configured security schemes, and seamless integration with Ts.ED's dependency injection system.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Automated OpenAPI/Swagger documentation with multi-version support for Ts.ED applications.

**Install in pnpm monorepo:**
```bash
# From repository root
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-swagger @radoslavirha/tsed-configuration @radoslavirha/tsed-platform @tsed/swagger @tsed/schema @tsed/di
```

**Essential Usage:**
```typescript
// 1. Bootstrap configuration (index.ts)
import { SwaggerConfig, SwaggerProvider } from '@radoslavirha/tsed-swagger';

const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
  title: config.api.service,
  version: config.api.version,
  documents: [
    CommonUtils.buildModel(SwaggerDocumentConfig, {
      docs: 'v1',
      security: [SwaggerSecurityScheme.BEARER_JWT]
    })
  ]
});
const swaggerProvider = new SwaggerProvider(swaggerConfig);

// 2. Server configuration
import { SwaggerController } from '@radoslavirha/tsed-swagger';

@Configuration({
  mount: { '/api': controllers },
  swagger: swaggerProvider.config  // Add Swagger settings
})
export class Server extends BaseServer {}

// 3. Document controllers
import { Docs } from '@radoslavirha/tsed-swagger';

@Controller('/users')
@Docs('v1')  // Include in v1 documentation
export class UserController {
  @Get('/:id')
  @Returns(200, User)
  async get(@PathParams('id') id: string): Promise<User> {}
}
```

**Key Components:**
- `SwaggerConfig` - Main configuration model
- `SwaggerProvider` - Converts config to Ts.ED SwaggerSettings
- `SwaggerController` - Custom-branded UI with version selector
- `@Docs(version)` - Decorator to include controllers in specific API versions

**Full documentation below** ↓

---

## Installation

```bash
# Install the package
pnpm add @radoslavirha/tsed-swagger

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-swagger

# Install peer dependencies
pnpm add @radoslavirha/tsed-configuration @radoslavirha/tsed-platform @tsed/di @tsed/json-mapper @tsed/openspec @tsed/platform-http @tsed/platform-params @tsed/platform-views @tsed/schema @tsed/swagger
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@radoslavirha/tsed-configuration` - Base configuration provider and API information
- `@radoslavirha/tsed-platform` - Server bootstrapping and platform utilities
- `@tsed/di` - Dependency injection decorators and services
- `@tsed/json-mapper` - JSON serialization utilities
- `@tsed/openspec` - OpenAPI specification types
- `@tsed/platform-http` - HTTP platform abstraction
- `@tsed/platform-params` - Parameter decorators for controllers
- `@tsed/platform-views` - View rendering for custom Swagger UI
- `@tsed/schema` - Schema and validation decorators
- `@tsed/swagger` - Ts.ED's Swagger integration

## What's Included

### Core Components

- **`SwaggerProvider`** - Converts declarative config into Ts.ED `SwaggerSettings[]`
- **`SwaggerController`** - Custom-branded Swagger UI controller with version selector
- **`SwaggerConfig`** - Main configuration model with all Swagger settings
- **`SwaggerDocumentConfig`** - Per-version document configuration
- **`SwaggerSecurityScheme`** - Enum for security schemes (BASIC, BEARER_JWT)

## Architecture Pattern

This package provides a declarative approach to configuring Swagger documentation in Ts.ED applications:

```
Configuration Layer
    ↓
SwaggerConfig + SwaggerDocumentConfig (Declarative Models)
    ↓
SwaggerProvider (Transformation Layer)
    ↓
Ts.ED SwaggerSettings[] (Framework Format)
    ↓
Server Configuration
    ↓
Swagger UI (Multiple Versions: /v1/docs, /v2/docs)
```

**Key Benefits:**
- ✅ **Multi-Version Support:** Document different API versions separately (v1, v2, internal)
- ✅ **Declarative Configuration:** Type-safe models instead of raw objects
- ✅ **Security Schemes:** Pre-configured Basic and Bearer JWT authentication
- ✅ **Custom Branding:** Branded landing page with version selector
- ✅ **Reverse Proxy Support:** Automatic URL handling for proxied environments
- ✅ **Integration:** Seamless integration with @radoslavirha/tsed-configuration
- ✅ **Export Specs:** Optional OpenAPI spec file export for tooling

## Usage

This package provides a complete solution for adding versioned Swagger documentation to your Ts.ED application. Follow these steps to set up comprehensive API documentation with multiple versions and security schemes.

**Prerequisites:**
Before setting up Swagger, ensure you have created a `ConfigService` following the [@radoslavirha/tsed-configuration](../configuration/#4-create-configservice-recommended-pattern) pattern. This provides access to API metadata (service name, version, description, publicURL) used in Swagger configuration.

### 1. Create Swagger Configuration (Bootstrap/Index)

Create your Swagger configuration in your application's bootstrap file (usually `index.ts` or `main.ts`). This configuration defines your API metadata, versions, and security requirements.

```typescript
// src/index.ts
import { $log } from '@tsed/common';
import { injector } from '@tsed/di';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { 
    SwaggerConfig, 
    SwaggerDocumentConfig, 
    SwaggerProvider,
    SwaggerSecurityScheme 
} from '@radoslavirha/tsed-swagger';
import { CommonUtils } from '@radoslavirha/utils';
import { Server } from './Server';
import { ConfigService } from './config/ConfigService';

try {
    // Load application configuration
    const config = injector().get<ConfigService>(ConfigService);

    // Build Swagger configuration
    const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
        title: config.api.service,
        version: config.api.version,
        description: config.api.description,
        serverUrl: config.api.publicURL, // For reverse proxy support
        documents: [
            // v1 API documentation
            CommonUtils.buildModel(SwaggerDocumentConfig, {
                docs: 'v1',
                security: [
                    SwaggerSecurityScheme.BASIC,
                    SwaggerSecurityScheme.BEARER_JWT
                ],
                outFile: './docs/swagger-v1.json' // Optional: export spec
            }),
            // v2 API documentation (JWT only)
            CommonUtils.buildModel(SwaggerDocumentConfig, {
                docs: 'v2',
                security: [SwaggerSecurityScheme.BEARER_JWT]
            })
        ],
        swaggerUIOptions: {
            validatorUrl: null, // Disable spec validation
            deepLinking: true,
            displayRequestDuration: true
        }
    });

    // Convert config to Ts.ED format
    const swaggerProvider = new SwaggerProvider(swaggerConfig);

    // Bootstrap server with Swagger configuration
    const configuration: ServerConfiguration = {
        ...config.server,
        api: config.api,
        swagger: swaggerProvider.config  // Inject Swagger settings
    };

    const platform = await Platform.bootstrap(Server, configuration);
    await platform.listen();
} catch (error) {
    $log.error('Bootstrap failed:', error);
    process.exit(1);
}
```

**Key Points:**
- `serverUrl` is crucial for reverse proxy/load balancer setups
- Each document in `documents` array creates a separate Swagger UI
- `outFile` optionally exports OpenAPI spec for client generation
- `swaggerUIOptions` customizes Swagger UI appearance and behavior

### 2. Mount Swagger Controller (Server Configuration)

Mount the `SwaggerController` in your Ts.ED server configuration. This controller provides a custom-branded landing page that lists all your API versions.

```typescript
// src/Server.ts
import { Configuration } from '@tsed/di';
import { BaseServer } from '@radoslavirha/tsed-platform';
import { SwaggerController } from '@radoslavirha/tsed-swagger';

@Configuration({
    mount: {
        '/': [SwaggerController],  // Serves custom Swagger UI landing page at root
        '/api/v1': [`${__dirname}/controllers/v1/**/*.ts`],
        '/api/v2': [`${__dirname}/controllers/v2/**/*.ts`]
    }
})
export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }
}
```

**Key Points:**
- Mount `SwaggerController` at root (`'/'`) for the documentation landing page
- The controller automatically serves Swagger UI for each configured version
- Version-specific controllers go in separate directories (v1, v2, etc.)
- Landing page displays all versions with clickable links

**What gets served:**
- `GET /` - Custom landing page with version selector
- `GET /v1/docs` - Swagger UI for v1 API
- `GET /v1/docs/swagger.json` - OpenAPI spec for v1
- `GET /v2/docs` - Swagger UI for v2 API
- `GET /v2/docs/swagger.json` - OpenAPI spec for v2

### 3. Document Controllers with @Docs() Decorator

Assign controllers to specific API versions using the `@Docs()` decorator from `@tsed/swagger`. The decorator value must match the `docs` property in your `SwaggerDocumentConfig`.

**Example: V1 Controller

```typescript
// src/controllers/v1/UserController.ts
import { Controller, Inject } from '@tsed/di';
import { Get, Post, Put, Delete, Returns, Security } from '@tsed/schema';
import { Docs } from '@tsed/swagger';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';
import { UserService } from '../../services/UserService';
import { UserModel } from '../../models/UserModel';

@Controller('/users')
@Docs('v1')  // Associates this controller with v1 documentation
export class UserControllerV1 {
    @Inject()
    private userService: UserService;

    @Get('/')
    @Returns(200, Array).Of(UserModel)
    @Returns(401).Description('Unauthorized')
    @Security(SwaggerSecurityScheme.BEARER_JWT)  // Requires JWT token
    async getAll(): Promise<UserModel[]> {
        return this.userService.findAll();
    }
}
```

**Key Points:**
- `@Docs('v1')` value must match `SwaggerDocumentConfig.docs: 'v1'`
- Use `@Security()` decorator to require authentication on endpoints
- Apply `@Security()` at class level for global endpoint security
- Mix security schemes with multiple `@Security()` parameters (logical OR)
- Use `@Returns()` for comprehensive response documentation
- Controllers without `@Docs()` appear in all versions

## API Reference

### SwaggerConfig

Main configuration model for the Swagger module. Defines global API metadata, document versions, and Swagger UI options.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | Yes | API title displayed in Swagger UI header |
| `version` | `string` | Yes | Application version (from package.json or config) |
| `description` | `string` | Yes | API description supporting Markdown |
| `documents` | `SwaggerDocumentConfig[]` | Yes | Array of document version configurations |
| `swaggerUIOptions` | `SwaggerUIConfig` | No | Swagger UI customization options |
| `serverUrl` | `string` | No | Public server URL for reverse proxy setups |

**Example:**
```typescript
const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: 'E-Commerce API',
    version: '2.1.0',
    description: 'Comprehensive REST API for e-commerce platform',
    serverUrl: 'https://api.example.com',
    documents: [
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v1',
            security: [SwaggerSecurityScheme.BASIC]
        }),
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v2',
            security: [SwaggerSecurityScheme.BEARER_JWT]
        })
    ],
    swaggerUIOptions: {
        deepLinking: true,
        filter: true
    }
});
```

---

### SwaggerDocumentConfig

Configuration model for a single API version/document. Each document represents a separate Swagger UI instance with its own security schemes and endpoints.

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `docs` | `string` | Yes | Document identifier (e.g., 'v1', 'v2', 'internal') |
| `security` | `SwaggerSecurityScheme[]` | Yes | Security schemes available in this document |
| `outFile` | `string` | No | File path to export OpenAPI spec |

**Example:**
```typescript
const docConfig = CommonUtils.buildModel(SwaggerDocumentConfig, {
    docs: 'v1',
    security: [
        SwaggerSecurityScheme.BASIC,
        SwaggerSecurityScheme.BEARER_JWT
    ],
    outFile: './docs/swagger-v1.json'
});
```

**Usage Notes:**
- `docs` value creates URL path: `/{docs}/docs` (e.g., `/v1/docs`)
- `docs` must match `@Docs('v1')` decorator parameter in controllers
- Multiple security schemes allow endpoints to choose authentication methods
- `outFile` exports spec for client generation and documentation tools

---

### SwaggerProvider

Provider class that converts declarative {@link SwaggerConfig} into Ts.ED's `SwaggerSettings[]` format. Extends `BaseConfigProvider` from `@radoslavirha/tsed-configuration`.

**Constructor:**
```typescript
new SwaggerProvider(config: SwaggerConfig)
```

**Property:**
- `config: SwaggerSettings[]` - Ts.ED-compatible Swagger settings array

**Behavior:**
1. Transforms each `SwaggerDocumentConfig` into a `SwaggerSettings` object
2. Generates OpenAPI 3.0.3 specification structure
3. Configures security schemes based on `SwaggerDocumentConfig.security`
4. Sets up Swagger UI paths and options
5. Handles `serverUrl` for reverse proxy scenarios

**Example Usage:**
```typescript
const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, { /* ... */ });
const swaggerProvider = new SwaggerProvider(swaggerConfig);

const configuration: ServerConfiguration = {
    swagger: swaggerProvider.config  // Use in server config
};
```

---

### SwaggerController

Controller that serves a custom-branded landing page listing all Swagger document versions. Hidden from Swagger documentation itself.

**Routes:**
- `GET /` - Custom landing page with version selector
- `GET /{version}/docs` - Swagger UI for specific version (handled by @tsed/swagger)
- `GET /{version}/docs/swagger.json` - OpenAPI spec (handled by @tsed/swagger)

**Features:**
- Custom EJS view template
- Automatic URL detection (handles proxies via headers)
- Service name and version display
- Clickable version cards

**Usage:**
```typescript
@Configuration({
    mount: {
        '/': [SwaggerController]
    }
})
export class Server extends BaseServer {}
```

---

### SwaggerSecurityScheme (Enum)

Enumeration of pre-configured security schemes for OpenAPI authentication.

**Values:**

| Value | Description | OpenAPI Mapping |
|-------|-------------|-----------------|
| `BASIC` | HTTP Basic authentication | `{ type: 'http', scheme: 'basic' }` |
| `BEARER_JWT` | Bearer token with JWT format | `{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }` |

**Usage in Controllers:**
```typescript
// Single security scheme
@Security(SwaggerSecurityScheme.BEARER_JWT)
@Get('/profile')
getProfile() {}

// Multiple schemes (logical OR)
@Security(SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT)
@Post('/users')
createUser() {}

// Global security at class level
@Controller('/admin')
@Security(SwaggerSecurityScheme.BEARER_JWT)
export class AdminController {
    // All endpoints require JWT
}
```

## Advanced Patterns

### Reverse Proxy / Load Balancer Setup

When your API is behind a reverse proxy or load balancer, use `serverUrl` to ensure Swagger UI generates correct request URLs:

```typescript
const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: 'API',
    version: '1.0.0',
    serverUrl: 'https://api.example.com',  // Public-facing URL
    documents: [
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v1',
            security: [SwaggerSecurityScheme.BEARER_JWT]
        })
    ]
});
```

**Scenario:** 
- Internal server: `http://localhost:4000`
- Nginx proxy: `https://api.example.com` → `http://localhost:4000`
- Without `serverUrl`: Swagger UI tries to call `http://localhost:4000` (fails from client)
- With `serverUrl`: Swagger UI correctly calls `https://api.example.com`

### Export Swagger Spec for Code Generation

Export OpenAPI specifications to files for client generation and documentation:

```typescript
const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: 'API',
    version: '1.0.0',
    documents: [
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v1',
            security: [SwaggerSecurityScheme.BEARER_JWT],
            outFile: './docs/openapi-v1.json'  // Export spec to file
        }),
        CommonUtils.buildModel(SwaggerDocumentConfig, {
            docs: 'v2',
            security: [SwaggerSecurityScheme.BEARER_JWT],
            outFile: './docs/openapi-v2.json'
        })
    ]
});
```

**Use cases:**
- **Client Generation:** Use with `openapi-generator` or `swagger-codegen`
- **Documentation Hosting:** Upload to external documentation platforms
- **Contract Testing:** Validate API responses against spec
- **Version Control:** Track API changes over time

## Complete Working Example

Full implementation with configuration, multiple versions, and security:

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
// src/index.ts
import { $log } from '@tsed/common';
import { injector } from '@tsed/di';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import {
    SwaggerConfig,
    SwaggerDocumentConfig,
    SwaggerProvider,
    SwaggerSecurityScheme,
    SwaggerUIConfig
} from '@radoslavirha/tsed-swagger';
import { CommonUtils } from '@radoslavirha/utils';
import { Server } from './Server';
import { ConfigService } from './config/ConfigService';

try {
    // Load application configuration
    const config = injector().get<ConfigService>(ConfigService);

    // Build Swagger configuration
    const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
        title: config.api.service,
        version: config.api.version,
        description: config.api.description,
        serverUrl: config.api.publicURL,
        documents: [
            // v1: Basic + JWT for backward compatibility
            CommonUtils.buildModel(SwaggerDocumentConfig, {
                docs: 'v1',
                security: [
                    SwaggerSecurityScheme.BASIC,
                    SwaggerSecurityScheme.BEARER_JWT
                ],
                outFile: './docs/swagger-v1.json'
            }),
            // v2: JWT only (modern approach)
            CommonUtils.buildModel(SwaggerDocumentConfig, {
                docs: 'v2',
                security: [SwaggerSecurityScheme.BEARER_JWT],
                outFile: './docs/swagger-v2.json'
            })
        ],
        swaggerUIOptions: CommonUtils.buildModel(SwaggerUIConfig, {
            validatorUrl: null
        })
    });

    // Convert to Ts.ED format
    const swaggerProvider = new SwaggerProvider(swaggerConfig);

    // Bootstrap server
    const configuration: ServerConfiguration = {
        ...config.server,
        api: config.api,
        swagger: swaggerProvider.config
    };

    const platform = await Platform.bootstrap(Server, configuration);
    await platform.listen();
} catch (error) {
    $log.error('Bootstrap failed:', error);
    process.exit(1);
}
```

```typescript
// src/Server.ts
import { Configuration } from '@tsed/di';
import { BaseServer } from '@radoslavirha/tsed-platform';
import { SwaggerController } from '@radoslavirha/tsed-swagger';

@Configuration({
    mount: {
        '/': [SwaggerController],
        '/api/v1': [`${__dirname}/controllers/v1/**/*.ts`],
        '/api/v2': [`${__dirname}/controllers/v2/**/*.ts`]
    }
})
export class Server extends BaseServer {
    $beforeRoutesInit(): void {
        this.registerMiddlewares();
    }
}
```

```typescript
// src/controllers/v1/UserController.ts
import { Controller, Inject } from '@tsed/di';
import { Get, Post, Put, Delete, Returns, Security } from '@tsed/schema';
import { Docs } from '@tsed/swagger';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';
import { UserService } from '../../services/UserService';
import { UserModel } from '../../models/UserModel';

@Controller('/users')
@Docs('v1')
export class UserControllerV1 {
    @Inject()
    private userService: UserService;

    @Get('/')
    @Returns(200, Array).Of(UserModel)
    @Security(SwaggerSecurityScheme.BEARER_JWT)
    async getAll(): Promise<UserModel[]> {
        return this.userService.findAll();
    }

    @Get('/:id')
    @Returns(200, UserModel)
    @Returns(404).Description('User not found')
    @Security(SwaggerSecurityScheme.BEARER_JWT)
    async getOne(@PathParams('id') id: string): Promise<UserModel> {
        return this.userService.findById(id);
    }

    @Post('/')
    @Returns(201, UserModel)
    @Security(SwaggerSecurityScheme.BASIC, SwaggerSecurityScheme.BEARER_JWT)
    async create(@BodyParams() user: UserModel): Promise<UserModel> {
        return this.userService.create(user);
    }

    @Put('/:id')
    @Returns(200, UserModel)
    @Security(SwaggerSecurityScheme.BEARER_JWT)
    async update(
        @PathParams('id') id: string,
        @BodyParams() user: UserModel
    ): Promise<UserModel> {
        return this.userService.update(id, user);
    }

    @Delete('/:id')
    @Returns(204).Description('User deleted')
    @Security(SwaggerSecurityScheme.BEARER_JWT)
    async delete(@PathParams('id') id: string): Promise<void> {
        await this.userService.delete(id);
    }
}
```

```typescript
// src/controllers/v2/UserController.ts
import { Controller, Inject } from '@tsed/di';
import { Get, Post, Put, Delete, Returns, Security } from '@tsed/schema';
import { Docs } from '@tsed/swagger';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';
import { UserService } from '../../services/UserService';
import { UserModelV2 } from '../../models/UserModelV2';

@Controller('/users')
@Docs('v2')
@Security(SwaggerSecurityScheme.BEARER_JWT)  // All endpoints require JWT
export class UserControllerV2 {
    @Inject()
    private userService: UserService;

    @Get('/')
    @Returns(200, Array).Of(UserModelV2)
    async getAll(): Promise<UserModelV2[]> {
        return this.userService.findAll();
    }

    @Get('/:id')
    @Returns(200, UserModelV2)
    @Returns(404).Description('User not found')
    async getOne(@PathParams('id') id: string): Promise<UserModelV2> {
        return this.userService.findById(id);
    }

    @Post('/')
    @Returns(201, UserModelV2)
    async create(@BodyParams() user: UserModelV2): Promise<UserModelV2> {
        return this.userService.create(user);
    }

    @Put('/:id')
    @Returns(200, UserModelV2)
    async update(
        @PathParams('id') id: string,
        @BodyParams() user: UserModelV2
    ): Promise<UserModelV2> {
        return this.userService.update(id, user);
    }

    @Delete('/:id')
    @Returns(204).Description('User deleted')
    async delete(@PathParams('id') id: string): Promise<void> {
        await this.userService.delete(id);
    }
}
```

## When to Use

✅ **Use this package when:**
- Building versioned APIs with Ts.ED (v1, v2, etc.)
- Need automatic OpenAPI/Swagger documentation
- Want pre-configured security schemes (Basic, Bearer JWT)
- Building APIs behind reverse proxies or load balancers
- Need consistent Swagger setup across multiple projects
- Exporting OpenAPI specs for client generation
- Want custom-branded Swagger UI landing page

❌ **Don't use when:**
- Not using Ts.ED framework (use framework-specific tools)
- Building GraphQL APIs (use GraphQL-specific tooling)
- Need custom security schemes beyond Basic/Bearer (extend the package)
- Simple single-version API without need for configuration abstraction

## Integration with Other Packages

This package is designed to work seamlessly with other packages in the toolkit:

### @radoslavirha/tsed-configuration

Provides configuration management and API information:

```typescript
import { injector } from '@tsed/di';
import { ConfigService } from './config/ConfigService';

const config = injector().get<ConfigService>(ConfigService);

// Use config values in Swagger setup
const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: config.api.service,
    version: config.api.version,
    serverUrl: config.api.publicURL
});
```

### @radoslavirha/tsed-platform

Provides server bootstrapping and configuration:

```typescript
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';

const configuration: ServerConfiguration = {
    ...config.server,
    swagger: swaggerProvider.config  // Inject Swagger settings
};

const platform = await Platform.bootstrap(Server, configuration);
```

### @radoslavirha/utils

Provides `CommonUtils.buildModel()` for type-safe model creation:

```typescript
import { CommonUtils } from '@radoslavirha/utils';

const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
    title: 'API',
    version: '1.0.0'
});
```

## Related Packages

- [@radoslavirha/tsed-configuration](../configuration/) - Configuration management and API information
- [@radoslavirha/tsed-platform](../platform/) - Server bootstrapping and platform utilities
- [@radoslavirha/utils](../../packages/utils/) - Common utilities including `CommonUtils.buildModel()`
- [@radoslavirha/types](../../packages/types/) - TypeScript utility types including `EnumDictionary`
