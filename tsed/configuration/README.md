# @radoslavirha/tsed-configuration

Central configuration provider for Ts.ED microservices. Aggregates configuration data from multiple sources (JSON files, environment variables, package.json) into a unified, type-safe provider with automatic schema validation using Ajv and Ts.ED decorators. This is a core service used across all microservices to provide consistent configuration management, validation, and access patterns.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Type-safe configuration management with validation for Ts.ED applications.

**Install in pnpm monorepo:**
```bash
# From repository root
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-configuration @tsed/ajv @tsed/core @tsed/di @tsed/json-mapper @tsed/schema ajv
```

**Essential Pattern:**
```typescript
// 1. Define ConfigModel
import { ConfigModel as BaseConfigModel } from '@radoslavirha/tsed-configuration';

export class ConfigModel extends BaseConfigModel {
  @Property() @Required() database: { url: string; };
}

// 2. Create ConfigService
import { ConfigProvider } from '@radoslavirha/tsed-configuration';

@Injectable()
export class ConfigService extends ConfigProvider<ConfigModel> {
  public static readonly options = { configModel: ConfigModel };
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

**Key Classes:**
- `ConfigProvider<T>` - Abstract base provider with multi-source aggregation
- `ConfigModel` - Base model with `api`, `server`, `env` properties

**Full documentation below** ↓

---

## Installation

```bash
# Install the package
pnpm add @radoslavirha/tsed-configuration

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-configuration

# Install peer dependencies
pnpm add @tsed/ajv @tsed/core @tsed/di @tsed/json-mapper @tsed/schema ajv
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@tsed/ajv` - Ajv integration for Ts.ED
- `@tsed/core` - Ts.ED core utilities
- `@tsed/di` - Dependency injection
- `@tsed/json-mapper` - JSON deserialization
- `@tsed/schema` - Schema decorators for validation
- `ajv` - JSON Schema validator

## What's Included

### Core Provider

- **`ConfigProvider<T>`** - Central configuration provider that orchestrates all configuration sources (JSON files, environment variables, package.json) and provides immutable access via deep cloning

### Models & Helpers

- **`BaseConfig`** - Base model for JSON configuration files (all custom configs should extend this)
- **`ServerConfig`** - TsED server configuration (currently supports `httpPort`)
- **`APIInformation`** - Composite model aggregating service metadata from multiple providers (for logging, monitoring, etc.)
- **`getServerDefaultConfig()`** - Returns sensible Ts.ED server defaults
- **`getHelmetDefaultDirectives()`** - Swagger-compatible Helmet CSP directives

### Base Classes

- **`BaseConfigProvider<T>`** - Abstract base for creating custom providers

## Architecture Pattern

The configuration system follows a layered approach:

```
ConfigProvider (Orchestrator)
    ├─> ConfigJsonProvider (config/*.json files + validation)
    ├─> EnvironmentVariablesProvider (process.env + .env file)
    ├─> PackageJsonProvider (package.json metadata)
    └─> Combines all → outputs: api, config, server, envs
```

**Flow:**
1. Load environment variables (`NODE_ENV`, custom vars, `.env` file)
2. Load `package.json` (name, version, description)
3. Load `config/{default,production,development}.json` based on `NODE_ENV`
4. Validate JSON config against your schema model (Ajv + @tsed/schema)
5. Combine into unified configuration with defaults

## Usage

### 1. Define Configuration Model

Create a configuration model using Ts.ED schema decorators for validation. All custom configuration classes should extend `BaseConfig` to ensure consistent server configuration and metadata properties.

```typescript
// ConfigModel.ts
import { Property, Required, Email } from '@tsed/schema';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export class DatabaseSettings {
    @Required()
    @Property(String)
    uri: string;

    @Property(String)
    name: string;
}

export class ConfigModel extends BaseConfig {
    @Required()
    @Property(DatabaseSettings)
    database: DatabaseSettings;

    @Email()
    @Property(String)
    adminEmail?: string;
}
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
    "database": {
        "uri": "mongodb://localhost:27017",
        "name": "myapp"
    }
}
```

**config/production.json:**
```json
{
    "publicURL": "https://api.example.com",
    "server": {
        "httpPort": 8080
    },
    "database": {
        "uri": "mongodb://prod-server:27017"
    },
    "adminEmail": "admin@example.com"
}
```

### 3. Setup Environment Variables

Create `.env` file (for local development):

```env
NODE_ENV=development
DATABASE_URI=mongodb://localhost:27017
LOG_LEVEL=debug
```

**In production:**
```bash
export NODE_ENV=production
export DATABASE_URI=mongodb://prod-server:27017
```

**Map environment variables to configuration (optional):**

Create `config/custom-environment-variables.json` to map environment variables to config properties:

```json
{
    "database": {
        "uri": "DATABASE_URI"
    }
}
```

This allows the `config` package to automatically use `process.env.DATABASE_URI` for `database.uri` in your configuration.

### 4. Create ConfigService (Recommended Pattern)

Extend `ConfigProvider` to create an injectable configuration service:

```typescript
// ConfigService.ts
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
import { Injectable } from '@tsed/di';
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

### 5. Bootstrap Server with ConfigService

```typescript
// index.ts
import { Platform } from '@tsed/common';
import { $log } from '@tsed/logger';
import { Platform, ServerConfiguration } from '@radoslavirha/tsed-platform';
import { injector } from '@tsed/di';
import { Server } from './Server';
import { ConfigService } from './ConfigService';

try {
    const config = injector().get<ConfigService>(ConfigService);
    
    // Access configuration
    const api = config.api;            // APIInformation (composite model)
    const server = config.server;      // Ts.ED server config

    console.log(`Starting ${api.service} v${api.version}`);

    // Bootstrap Ts.ED platform
    const configuration: ServerConfiguration = {
        ...server,
        api: api
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

### ConfigProvider<T extends BaseConfig>

Central configuration provider for Ts.ED microservices. This is a core service used across all microservices to provide consistent configuration management, validation, and access patterns.

**Aggregates configuration from:**
- JSON configuration files (via ConfigJsonProvider)
- Environment variables (via EnvironmentVariablesProvider)  
- package.json metadata (via PackageJsonProvider)

**Constructor:**
```typescript
constructor(@Opts options: ConfigProviderOptions<T>)
```

Loads and aggregates configuration from multiple sources:
1. Environment variables
2. package.json
3. JSON configuration files (validated against the model)
4. Constructs API information from the gathered data
5. Builds final server configuration with defaults

**Type Parameter:**
- `T extends BaseConfig` - Your configuration model class

**Options:**
```typescript
type ConfigProviderOptions<T> = {
    configModel: Type<T>;  // Configuration model class decorated with @tsed/schema decorators
    debug?: boolean;       // Enable debug logging for configuration loading and validation
};
```

**Properties (all return immutable deep clones):**

- `api: APIInformation` - Composite service metadata (name, version, description, publicURL) for quick access in logging, monitoring, etc.
- `config: T` - Your validated configuration model instance
- `server: Partial<TsED.Configuration>` - Ts.ED server configuration with defaults
- `envs: ENVS` - All environment variables
- `packageJson: PkgJson` - Package.json name, version, description
- `isTest: boolean` - True if `NODE_ENV === 'test'`

**Immutability:** All getter methods return deep clones to prevent accidental mutations.

---

### BaseConfig

Base model for JSON configuration files.

This class serves as the foundation for application configuration models. All custom configuration classes should extend this base class to ensure consistent server configuration and metadata properties.

**Properties:**
```typescript
class BaseConfig {
    server: ServerConfig;    // TsED server configuration (Required)
    serviceName?: string;    // Service name (If not set, the name from package.json will be used)
    publicURL?: string;      // Public URL of the service including protocol, domain and path if deployed behind a reverse proxy
}
```

**Remarks:**
- Should be decorated with @tsed/schema decorators for JSON Schema validation
- Configuration files are loaded from the `config/` directory via the 'config' package
- Validated using Ajv against the generated JSON Schema

**Usage:**
```typescript
import { Property } from '@tsed/schema';
import { BaseConfig } from './models/BaseConfig.js';

export class AppConfig extends BaseConfig {
    @Property()
    databaseUrl: string;
    
    @Property()
    apiKey: string;
}
```

---

### APIInformation

Composite model that aggregates service metadata collected from multiple configuration providers.

Provides quick access to essential service information for use in microservices (e.g., logging, monitoring, service discovery).

**Properties:**
```typescript
class APIInformation {
    service: string;      // Service name
    version: string;      // Service version
    description?: string; // Service description
    publicURL?: string;   // Public URL of the service including protocol, domain and path if deployed behind a reverse proxy (e.g., 'https://api.example.com/v1')
}
```

**Remarks:**
- The data in this model is typically assembled from various sources such as package.json, environment variables, and configuration files
- Automatically populated by ConfigProvider during initialization

---

### Helper Functions

### ServerConfig

TsED server configuration.

Defines the server configuration properties for the application.

**Properties:**
```typescript
class ServerConfig {
    httpPort: number;  // The HTTP port to listen on (Required)
}
```

**Remarks:**
Currently configured to support basic HTTP server setup with httpPort.

---

**`getServerDefaultConfig(): Partial<TsED.Configuration>`**

Returns sensible default configuration for Ts.ED servers:

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

**`getHelmetDefaultDirectives(): HelmetCspDirectives`**

Returns Content Security Policy directives compatible with Swagger UI.

---

### BaseConfigProvider<T>

Abstract base class for creating custom configuration providers.

**Constructor:**
```typescript
constructor(config: T)
```

**Property:**
- `config: T` - Returns a deep clone of the configuration

**Use Case:** Extend this to create specialized configuration providers.

## Advanced Patterns

### Multiple Configuration Sources

```typescript
// CustomConfigProvider.ts
import { BaseConfigProvider } from '@radoslavirha/tsed-configuration';

interface ExternalAPIConfig {
    apiKey: string;
    endpoint: string;
}

export class ExternalAPIConfigProvider extends BaseConfigProvider<ExternalAPIConfig> {
    constructor() {
        // Load from external source (database, API, etc.)
        const config = {
            apiKey: process.env.EXTERNAL_API_KEY!,
            endpoint: 'https://api.example.com'
        };
        super(config);
    }
}
```

### Accessing Config in Middleware

```typescript
@Middleware()
export class AuthMiddleware {
    @Inject()
    private config: ConfigService;

    use(@Req() req: Req) {
        const appConfig = this.config.config;
        const api = this.config.api;  // Access composite API information
        // Use configuration for auth logic
    }
}
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/tsed-platform](../platform/) - Uses ConfigProvider for server bootstrap
- [@radoslavirha/tsed-swagger](../swagger/) - Uses APIInformation for Swagger docs
- [@radoslavirha/utils](../../packages/utils/) - Uses DefaultsUtil internally
