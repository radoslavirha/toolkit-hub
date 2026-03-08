# @radoslavirha/tsed-configuration

Central configuration provider for Ts.ED microservices. Aggregates configuration data from multiple sources (JSON files, environment variables, package.json) into a unified, type-safe provider with automatic schema validation using Zod. This is a core service used across all microservices to provide consistent configuration management, validation, and access patterns.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Type-safe configuration management with Zod validation for Ts.ED applications.

**Install in pnpm monorepo:**
```bash
# From repository root
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-configuration @tsed/core @tsed/di @tsed/json-mapper @tsed/schema zod
```

**Essential Pattern:**
```typescript
// 1. Define config schema by extending BaseConfig
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
    databaseUrl: z.string()
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

// 2. Create ConfigService
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';

@Injectable()
export class ConfigService extends ConfigProvider<AppConfig> {
    public static readonly options: ConfigProviderOptions<AppConfig> = {
        schema: AppConfigSchema
    };
    constructor() { super(ConfigService.options); }
}

// 3. Use in bootstrap (index.ts)
import { injector } from '@tsed/di';

const config = injector().get<ConfigService>(ConfigService);
const platform = await Platform.bootstrap(Server, {
  ...config.server,  // httpPort, httpsPort, etc.
  api: config.api    // service, version, description
});
```

**Configuration Sources (priority order):**
1. Environment variables (e.g., `PORT=3000`)
2. JSON config files (`config/default.json`, `config/{env}.json`)
3. package.json (`name`, `version`)

**Key Exports:**
- `ConfigProvider<T>` — Central provider with multi-source aggregation
- `BaseConfig` — Zod schema that all app config schemas extend
- `ServerConfig` — Zod schema for the `server` block

**Full documentation below** ↓

---

## Installation

```bash
# Install the package
pnpm add @radoslavirha/tsed-configuration

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-configuration

# Install peer dependencies
pnpm add @tsed/core @tsed/di @tsed/json-mapper @tsed/schema zod
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@tsed/core` — Ts.ED core utilities
- `@tsed/di` — Dependency injection
- `@tsed/json-mapper` — JSON deserialization
- `@tsed/schema` — Ts.ED schema types
- `zod` — Schema validation

## What's Included

### Core Provider

- **`ConfigProvider<T>`** — Central configuration provider that orchestrates all configuration sources (JSON files, environment variables, package.json) and provides immutable access via deep cloning

### Schemas & Models

- **`BaseConfig`** — Base Zod schema for JSON configuration files (all custom config schemas should extend this via `.extend()`)
- **`ServerConfig`** — Zod schema for the `server` block in config files (requires `httpPort`; accepts any additional TsED `Configuration` properties via `z.looseObject`)
- **`APIInformation`** — Composite model aggregating service metadata from multiple providers (for logging, monitoring, etc.)
- **`getServerDefaultConfig()`** — Returns sensible Ts.ED server defaults
- **`getHelmetDefaultDirectives()`** — Swagger-compatible Helmet CSP directives

### Base Classes

- **`BaseConfigProvider<T>`** — Abstract base for creating custom providers

## Architecture Pattern

The configuration system follows a layered approach:

```
ConfigProvider (Orchestrator)
    ├─> ConfigJsonProvider (config/*.json files + Zod validation)
    ├─> EnvironmentVariablesProvider (process.env + .env file)
    ├─> PackageJsonProvider (package.json metadata)
    └─> Combines all → outputs: api, config, server, envs
```

**Flow:**
1. Load environment variables (`NODE_ENV`, custom vars, `.env` file)
2. Load `package.json` (name, version, description)
3. Load `config/{default,production,development}.json` based on `NODE_ENV`
4. Validate JSON config against your Zod schema
5. Combine into unified configuration with defaults

## Usage

### 1. Define Configuration Schema

Create a Zod schema by extending `BaseConfig`. All custom schemas must extend `BaseConfig` to ensure the required `server` block and optional metadata fields are always present.

```typescript
// config/AppConfigSchema.ts
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
    databaseUrl: z.string(),
    adminEmail: z.string().email().optional()
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
```

### 2. Create Configuration Files

Use the [config library](https://www.npmjs.com/package/config) directory structure:

```
config/
├── default.json                        # Base configuration (required)
├── development.json                    # Dev environment overrides
├── production.json                     # Production overrides
├── test.json                           # Test environment
└── custom-environment-variables.json   # Maps environment variables to config properties (optional)
```

**config/default.json:**
```json
{
    "serviceName": "my-api",
    "publicURL": "http://localhost:4000",
    "server": {
        "httpPort": 4000
    },
    "databaseUrl": "mongodb://localhost:27017/myapp"
}
```

**config/production.json:**
```json
{
    "publicURL": "https://api.example.com",
    "server": {
        "httpPort": 8080
    },
    "databaseUrl": "mongodb://prod-server:27017/myapp",
    "adminEmail": "admin@example.com"
}
```

### 3. Setup Environment Variables

Create `.env` file (for local development):

```env
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017
LOG_LEVEL=debug
```

**In production:**
```bash
export NODE_ENV=production
export DATABASE_URL=mongodb://prod-server:27017
```

**Map environment variables to configuration (optional):**

Create `config/custom-environment-variables.json` to map environment variables to config properties:

```json
{
    "databaseUrl": "DATABASE_URL"
}
```

This allows the `config` package to automatically use `process.env.DATABASE_URL` for `databaseUrl` in your configuration.

### 4. Create ConfigService (Recommended Pattern)

Extend `ConfigProvider` to create an injectable configuration service:

```typescript
// ConfigService.ts
import { Injectable } from '@tsed/di';
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
import { AppConfigSchema, AppConfig } from './AppConfigSchema.js';

@Injectable()
export class ConfigService extends ConfigProvider<AppConfig> {
    public static readonly options: ConfigProviderOptions<AppConfig> = {
        schema: AppConfigSchema
    };

    constructor() {
        super(ConfigService.options);
    }
}
```

### 5. Bootstrap Server with ConfigService

```typescript
// index.ts
import { $log } from '@tsed/logger';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { injector } from '@tsed/di';
import { Server } from './Server.js';
import { ConfigService } from './ConfigService.js';

try {
    const config = injector().get<ConfigService>(ConfigService);

    const api = config.api;       // APIInformation (service, version, description, publicURL)
    const server = config.server; // Ts.ED server config with defaults

    console.log(`Starting ${api.service} v${api.version}`);

    const configuration: ServerConfiguration = {
        api: api
        ...server
    };

    const platform = await Platform.bootstrap(Server, configuration);

    await platform.listen();
    $log.info(`Server listening on port ${server.httpPort}`);
} catch (error) {
    $log.error('Bootstrap failed:', error);
    process.exit(1);
}
```

## API Reference

### `ConfigProvider<T extends BaseConfig>`

Central configuration provider for Ts.ED microservices.

**Aggregates configuration from:**
- JSON configuration files (via `ConfigJsonProvider`)
- Environment variables (via `EnvironmentVariablesProvider`)
- package.json metadata (via `PackageJsonProvider`)

**Constructor:**
```typescript
constructor(@Opts options: ConfigProviderOptions<T>)
```

**Options:**
```typescript
type ConfigProviderOptions<T extends BaseConfig> = {
    schema: ZodType<T>;  // Zod schema whose inferred type extends BaseConfig
    debug?: boolean;     // Log the raw config object before validation (default: false)
};
```

**Properties (all return immutable deep clones):**

| Property | Type | Description |
|---|---|---|
| `api` | `APIInformation` | Service metadata (name, version, description, publicURL) |
| `config` | `T` | Your validated configuration object |
| `server` | `Partial<TsED.Configuration>` | Ts.ED server config with defaults merged in |
| `envs` | `ENVS` | All environment variables |
| `packageJson` | `PkgJson` | Package.json name, version, description |
| `isTest` | `boolean` | `true` when `NODE_ENV === 'test'` |

**Immutability:** All getters return deep clones to prevent accidental mutations.

---

### `BaseConfig`

Base Zod schema for JSON configuration files. Extend this schema to define your application's configuration shape.

**Schema:**
```typescript
const BaseConfig = z.object({
    server: ServerConfig,            // Required — TsED server settings
    serviceName: z.string().optional(), // Defaults to package.json name if not set
    publicURL: z.string().optional()    // Full public URL including path (e.g. https://api.example.com/v1)
});
```

**Extending:**
```typescript
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
    databaseUrl: z.string(),
    featureFlags: z.object({
        newUI: z.boolean().default(false)
    }).optional()
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
```

---

### `ServerConfig`

Zod schema for the `server` block. Requires `httpPort`. Uses `z.looseObject()` so any additional TsED `Configuration` properties in the JSON file (e.g. `httpsPort`, `acceptMimes`) are forwarded to the server untouched.

**Schema:**
```typescript
const ServerConfig = z.looseObject({
    httpPort: z.number()   // Required — HTTP port to listen on
});
```

**JSON example:**
```json
{
    "server": {
        "httpPort": 4000
    }
}
```

---

### `APIInformation`

Composite model aggregating service metadata from multiple configuration sources.

**Properties:**
```typescript
class APIInformation {
    service: string;       // Service name (from serviceName or package.json)
    version: string;       // Version (from package.json)
    description?: string;  // Description (from package.json)
    publicURL?: string;    // Public URL (from publicURL config field)
}
```

Automatically populated by `ConfigProvider` during initialization.

---

### `getServerDefaultConfig(): Partial<TsED.Configuration>`

Returns sensible default configuration for Ts.ED servers, merged with your `server` block:

```typescript
{
    httpPort: 4000,
    acceptMimes: ['application/json'],
    httpsPort: false,
    exclude: ['**/*.spec.ts'],
    disableComponentsScan: true,
    jsonMapper: {
        additionalProperties: false
    },
    ajv: {
        returnsCoercedValues: true
    }
}
```

---

### `getHelmetDefaultDirectives(): HelmetCspDirectives`

Returns Content Security Policy directives compatible with Swagger UI.

---

### `BaseConfigProvider<T>`

Abstract base class for creating custom configuration providers.

**Constructor:**
```typescript
constructor(config: T)
```

**Property:**
- `config: T` — Returns a deep clone of the configuration

**Use Case:** Extend this to create specialized configuration providers.

```typescript
import { BaseConfigProvider } from '@radoslavirha/tsed-configuration';

interface ExternalAPIConfig {
    apiKey: string;
    endpoint: string;
}

export class ExternalAPIConfigProvider extends BaseConfigProvider<ExternalAPIConfig> {
    constructor() {
        super({
            apiKey: process.env.EXTERNAL_API_KEY!,
            endpoint: 'https://api.example.com'
        });
    }
}
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/tsed-platform](../platform/) — Uses ConfigProvider for server bootstrap
- [@radoslavirha/tsed-swagger](../swagger/) — Uses APIInformation for Swagger docs
- [@radoslavirha/tsed-common](../common/) — Provides ZodValidator used internally
- [@radoslavirha/utils](../../packages/utils/) — Uses DefaultsUtil internally
