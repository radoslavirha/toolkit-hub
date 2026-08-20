# AI Agent Development Guide - toolkit-hub

> **For AI Agents:** This document provides cross-package integration patterns, architectural decisions, and common scenarios for building Ts.ED services with this toolkit. Each package has detailed documentation in its README - this guide shows how they work together.

---

## 📦 Package Overview & Selection

### Core Framework Packages (Ts.ED)

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/tsed-platform](tsed/platform/) | Express server bootstrap & base classes | **Always** - Required for any Ts.ED service |
| [@radoslavirha/tsed-configuration](tsed/configuration/) | Config management (JSON/ENV) | **Always** - Required for Ts.ED service configuration |
| [@radoslavirha/tsed-swagger](tsed/swagger/) | Multi-version Swagger/OpenAPI docs | When building Ts.ED REST APIs that need documentation |
| [@radoslavirha/tsed-mongoose](tsed/mongoose/) | Clean architecture MongoDB integration | When using MongoDB with mapper pattern in Ts.ED  service |
| [@radoslavirha/tsed-common](tsed/common/) | Base models, typed serialization, and AJV/Zod schema validation | When using Ts.ED models, tsed-mongoose, or validating arbitrary input |
| [@radoslavirha/tsed-logger](tsed/logger/) | Ts.ED injectable logger (DI wrapper around `@radoslavirha/logger`) | When you need structured logging in a Ts.ED service via dependency injection |

### Utility Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/utils](packages/utils/) | Common utility methods | **Always** - When you need common operations (don't reinvent the wheel) for e.g. numeric, string, object operations and more |
| [@radoslavirha/types](packages/types/) | TypeScript utility types (`Dictionary`, `EnumDictionary`, `NullableProperty`, `FullPartial`) | When you need common reusable types or to avoid lodash type imports |
| [@radoslavirha/logger](packages/logger/) | OTEL-compliant Winston logger (zero dependencies on Ts.ED) | When you need structured JSON logging outside of Ts.ED, or as the core logger in any Node.js package |
| [@radoslavirha/redaction](packages/redaction/) | Pre-compiled, config-driven redaction of sensitive fields | When a package logs payloads, headers or query strings — redact **before** calling the logger |

### Logging conventions

The logger is a **pure transport**: it does not redact and does not know about HTTP. Callers
build the log structure and sanitise it first.

| Package kind | Pattern |
|---|---|
| Ts.ED packages | `@Inject(Logger)` then `logger.child('<SCOPE>')` |
| Framework-free packages | Accept a structural `{ child, info, error }` port — never import a logger |
| Anything logging payloads | Build one `RedactionProfile` at construction, `collect()` per call |

Scope naming is `SUBSYSTEM` or `SUBSYSTEM:instance` — e.g. `HTTP_REQUEST` (inbound),
`HTTP_CLIENT:miot-spec` (outbound, per configured provider).

### Configuration Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/config-typescript](config/config-typescript/) | Shared TypeScript config | **Always** - Base tsconfig for all packages |
| [@radoslavirha/config-eslint](config/config-eslint/) | Shared ESLint config | **Always** - Consistent linting rules |
| [@radoslavirha/config-tsdown](config/config-tsdown/) | Build configuration with tsdown | When building library packages (not apps) |
| [@radoslavirha/config-vitest](config/config-vitest/) | Test configuration with Vitest | When writing unit/integration tests |

---

## 🏗️ Architecture Patterns

### Layer Separation (Clean Architecture)

```
Controllers (API Layer)
    ↓ depends on
Handlers (API Layer)
    ↓ depends on
Services (Business Logic)
    ↓ depends on
Mappers (Transformation Layer)
    ↓ depends on
Mongoose Models (Data Layer)
```

**Key Principle:** Each layer only knows about the layer below it, not above.

### Dependency Injection Flow

```typescript
// 1. Register models and services
@Configuration({
})
export class Server extends BaseServer {}

// 2. Inject via constructor (no base class — plain @Injectable)
@Injectable()
export class Service {
  @Inject(Repository)
  private repository!: Repository;

  @Inject(Mapper)
  private mapper!: Mapper;

  async findById(id: string): Promise<Model | null> {
    const mongo = await this.repository.findById(id);
    return mongo ? this.mapper.mongoToModel(mongo) : null;
  }

  async create(model: Model): Promise<Model> {
    const mongo = await this.repository.create(this.mapper.buildMongoCreate(model));
    return this.mapper.mongoToModel(mongo);
  }
}

// 3. Controllers inject services
@Controller('/')
export class Controller {
  constructor(private service: Service) {}
}
```

---

## 🎯 Common Integration Patterns

### Pattern 1: Full REST API with MongoDB

**Packages:** platform + configuration + swagger + mongoose + common + utils

```typescript
// 1. Configuration Service (tsed-configuration)
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
  config: z.object({ mongodb: z.object({ url: z.string() }) })
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

@Injectable()
export class ConfigService extends ConfigProvider<AppConfig> {
  public static readonly options: ConfigProviderOptions<AppConfig> = {
    schema: AppConfigSchema
  };
  constructor() {
    super(ConfigService.options);
  }
}

// 2. Bootstrap with Swagger (index.ts)
import { Platform } from '@radoslavirha/tsed-platform';
import { SwaggerConfig, SwaggerProvider } from '@radoslavirha/tsed-swagger';
import { CommonUtils } from '@radoslavirha/utils';

const config = injector().get<ConfigService>(ConfigService);

const swaggerConfig = CommonUtils.buildModelPartial(SwaggerConfig, {
  title: config.api.service,
  version: config.api.version,
  description: config.api.description,
  documents: [
    CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
      docs: 'v1',
      security: [SwaggerSecurityScheme.BEARER_JWT]
    })
  ]
});

const configuration: ServerConfiguration = {
  ...config.server,
  swagger: new SwaggerProvider(swaggerConfig).config,
  mongoose: [{ url: config.config.mongodb.url, connectionOptions: config.config.mongodb.connectionOptions }]
};

await Platform.bootstrap(Server, configuration);

// 3. Mongoose Schema (tsed-mongoose + tsed-common)
import { Model } from '@tsed/mongoose';
import { BaseMongo } from '@radoslavirha/tsed-mongoose';

@Model()
export class MongoModel extends BaseMongo {
  @Property() name: string;
  @Property() email: string;
}

// 4. API Model (tsed-common)
import { BaseModel, Serializer, JSONSchemaValidator, ZodValidator } from '@radoslavirha/tsed-common';

export class Model extends BaseModel {
  @Property() name: string;
  @Property() email: string;
}

// 5. Mapper (tsed-mongoose + utils)
import { MongoMapper, MongoCreate, MongoUpdate } from '@radoslavirha/tsed-mongoose';
import { CommonUtils } from '@radoslavirha/utils';

@Injectable()
export class Mapper extends MongoMapper<MongoModel, Model> {
  // Required: declare class constructors
  protected mongo = MongoModel;
  protected model = Model;

  public mongoToModel(mongo: MongoModel): Model {
    return CommonUtils.buildModelStrict(Model, {
      ...this.mongoToModelBase(mongo),   // spreads id, createdAt, updatedAt
      name: mongo.name,
      email: mongo.email,
    });
  }

  // POST / create — getModelValue falls back to @Default() when undefined
  public buildMongoCreate(model: Model): MongoCreate<MongoModel> {
    return this.buildMongoPayload({
      name: this.getModelValue(model, 'name'),
      email: this.getModelValue(model, 'email'),
    });
  }

  // PATCH / update — patch=true skips default fallback, omits undefined fields
  public buildMongoUpdate(model: Model): MongoUpdate<MongoModel> {
    return this.buildMongoUpdatePayload({
      name: this.getModelValue(model, 'name', true),
    });
  }
}

// 6. Repository (tsed-mongoose)
import { MongoRepository } from '@radoslavirha/tsed-mongoose';

@Injectable()
export class Repository extends MongoRepository<MongoModel> {
  @Inject(MongoModel)
  protected model!: MongooseModel<MongoModel>;

  protected mongo = MongoModel;  // ← formerly called 'type'
}

// 7. Service — plain @Injectable(), no base class
@Injectable()
export class Service {
  @Inject(Repository)
  private repository!: Repository;

  @Inject(Mapper)
  private mapper!: Mapper;

  async findAll(): Promise<Model[]> {
    return (await this.repository.find()).map(m => this.mapper.mongoToModel(m));
  }

  async create(model: Model): Promise<Model> {
    const mongo = await this.repository.create(this.mapper.buildMongoCreate(model));
    return this.mapper.mongoToModel(mongo);
  }

  async update(id: string, model: Model): Promise<Model | null> {
    const mongo = await this.repository.findByIdAndUpdate(id, this.mapper.buildMongoUpdate(model));
    return mongo ? this.mapper.mongoToModel(mongo) : null;
  }
}

// 8. Controller (tsed-swagger)
import { Docs } from '@tsed/swagger';
import { SwaggerSecurityScheme } from '@radoslavirha/tsed-swagger';

@Controller('/')
@Docs('v1')
export class Controller {
  constructor(
    private handlerGet: HandlerGet,
    private handlerPost: HandlerPost
  ) {}
  
  @Get('/')
  @Returns(200, Array).Of(Model)
  @Security(SwaggerSecurityScheme.BEARER_JWT)
  async getAll(): Promise<Model[]> {
    return this.handlerGet.performOperation();
  }
  
  @Post('/')
  @Returns(201, Model)
  @Security(SwaggerSecurityScheme.BEARER_JWT)
  async create(@Required() @BodyParams(Model) request: Request): Promise<Model> {
    return this.handlerPost.performOperation(request);
  }
}

// 8. Server Configuration (tsed-platform + tsed-swagger)
import { BaseServer } from '@radoslavirha/tsed-platform';
import { SwaggerController } from '@radoslavirha/tsed-swagger';
import * as controllers from './controllers/index.js';

@Configuration({
  mount: {
    '/': [SwaggerController],
    '/api/v1': [...Object.values(controllers)]
  }
})
export class Server extends BaseServer {
  $beforeRoutesInit(): void {
    this.registerMiddlewares();
  }
}
```

**Installation:**
```bash
pnpm --filter YOUR_SERVICE_NAME add \
  @radoslavirha/tsed-platform \
  @radoslavirha/tsed-configuration \
  @radoslavirha/tsed-swagger \
  @radoslavirha/tsed-mongoose \
  @radoslavirha/tsed-common \
  @radoslavirha/utils
```

---

### Pattern 2: REST API without Database

**Packages:** platform + configuration + swagger + utils

```typescript
// Minimal service with Swagger docs but no database
// Skip mongoose, mappers
// Controllers calls internal services

@Controller('/health')
@Docs('v1')
export class HealthController {
  constructor(
    private handler: Handler
  ) {}

  @Get('/')
  @Returns(200, String)
  async check(): Promise<string> {
    return this.handler.performOperation();
  }
}
```

**Installation:**
```bash
pnpm --filter YOUR_SERVICE_NAME add \
  @radoslavirha/tsed-platform \
  @radoslavirha/tsed-configuration \
  @radoslavirha/tsed-swagger \
  @radoslavirha/utils
```

---

### Pattern 3: Background Worker with MongoDB

**Packages:** platform + configuration + mongoose + common + utils

```typescript
// No Swagger, no controllers
// Just services processing queues or scheduled jobs

import { Platform } from '@radoslavirha/tsed-platform';

const config = injector().get<ConfigService>(ConfigService);

const configuration: ServerConfiguration = {
  ...config.server,
  mongoose: [{ url: config.config.mongodb.url, connectionOptions: config.config.mongodb.connectionOptions }]
  // No mount, no Swagger
};

await Platform.bootstrap(Server, configuration);

// Use services directly, no HTTP layer
const Service = injector().get<Service>(Service);
await Service.processQueue();
```

**Installation:**
```bash
pnpm --filter YOUR_SERVICE_NAME add \
  @radoslavirha/tsed-platform \
  @radoslavirha/tsed-configuration \
  @radoslavirha/tsed-mongoose \
  @radoslavirha/tsed-common \
  @radoslavirha/utils
```

---

## 🚫 Anti-Patterns & Common Mistakes

### 1. BaseHandler Usage

❌ **WRONG:**
```typescript
@Injectable()
export class MyHandler extends BaseHandler<Request, Response> {
  constructor() {
    super(); // NO! BaseHandler doesn't have constructor parameters
  }
}
```

✅ **CORRECT:**
```typescript
@Injectable()
export class MyHandler extends BaseHandler<Request, Response> {
  // No constructor needed, or use it only for injected dependencies
  constructor(private myService: MyService) {
    super();
  }
}
```

### 2. Configuration Loading

❌ **WRONG:**
```typescript
// In service/controller
const config = new ConfigService(); // Creates new instance
```

✅ **CORRECT:**
```typescript
// In bootstrap (index.ts)
const config = injector().get<ConfigService>(ConfigService);

// In services/controllers - inject it
constructor(private config: ConfigService) {}
```

### 3. Mount Configuration

❌ **WRONG:**
```typescript
@Configuration({
  mount: {
    '/api': [`${__dirname}/controllers/**/*.ts`] // Glob pattern
  }
})
```

✅ **CORRECT:**
```typescript
import * as controllers from './controllers/index.js';

@Configuration({
  mount: {
    '/api': [...Object.values(controllers)]
  }
})
```

### 4. Mapper Methods

❌ **WRONG — old mutation pattern:**
```typescript
@Injectable()
class Mapper extends MongoMapper<MongoModel, Model> {
  async mongoToModel(mongo: MongoModel): Promise<Model> {
    const model = new Model();
    this.mongoToModelBase(model, mongo); // ❌ old mutating signature is gone
    model.name = mongo.name;
    return model;
  }
  // ❌ modelToMongoCreateObject / modelToMongoUpdateObject no longer exist
  async modelToMongoCreateObject(model: Model) { return { name: model.name }; }
}
```

✅ **CORRECT — declare mongo+model, use spread + helpers:**
```typescript
import { CommonUtils } from '@radoslavirha/utils';
import { MongoCreate, MongoUpdate } from '@radoslavirha/tsed-mongoose';

@Injectable()
class Mapper extends MongoMapper<MongoModel, Model> {
  protected mongo = MongoModel;   // required
  protected model = Model;        // required

  public mongoToModel(mongo: MongoModel): Model {
    return CommonUtils.buildModelStrict(Model, {
      ...this.mongoToModelBase(mongo),  // returns {id, createdAt, updatedAt} — spread it
      name: mongo.name,
    });
  }

  public buildMongoCreate(model: Model): MongoCreate<MongoModel> {
    return this.buildMongoPayload({
      name: this.getModelValue(model, 'name'),         // POST — uses @Default if undefined
    });
  }

  public buildMongoUpdate(model: Model): MongoUpdate<MongoModel> {
    return this.buildMongoUpdatePayload({
      name: this.getModelValue(model, 'name', true),  // PATCH — omits undefined fields
    });
  }
}
```

❌ **WRONG — repository still using old `type` property:**
```typescript
class Repository extends MongoRepository<MongoModel> {
  protected type: Type<MongoModel> = MongoModel;  // ❌ renamed to 'mongo'
}
```

✅ **CORRECT:**
```typescript
class Repository extends MongoRepository<MongoModel> {
  protected mongo = MongoModel;  // ✅
}
```

### 5. Installation in Monorepo

❌ **WRONG:**
```bash
pnpm add -w @radoslavirha/utils # Installing in workspace root
```

✅ **CORRECT:**
```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/utils
```

### 6. Swagger Document Configuration

❌ **WRONG:**
```typescript
documents: [{
  path: '/v1',
  version: 'v1',
  securitySchemes: [...]
}]
```

✅ **CORRECT:**
```typescript
documents: [
  CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
    docs: 'v1',
    security: [SwaggerSecurityScheme.BEARER_JWT]
  })
]
```

---

## 🔧 Configuration Best Practices

### Environment-Specific Configs

```
config/
  default.json         # Base config
  development.json     # Dev overrides
  production.json      # Prod overrides
  test.json           # Test overrides
```

**Loading Priority:** `default.json` → `{NODE_ENV}.json` → Environment variables

### Configuration Schema Pattern

```typescript
// config/AppConfigSchema.ts
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
  mongo: z.object({ url: z.string() })
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

// config/ConfigService.ts
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

---

## 🛠️ Utilities Quick Reference

`@radoslavirha/utils` covers the operations services keep reinventing. Reach for it before
writing a raw `=== null`, a `typeof` test, `Array.isArray`, a deep clone, or a distance
calculation.

| Class | Use it for |
|---|---|
| `CommonUtils` | null/undefined/empty guards, and the `buildModel*` family for constructing models |
| `ObjectUtils` | object guards, typed keys/values, deep clone, deep merge, `enabled` guard |
| `ArrayUtils` | array guard, normalising a value to an array |
| `StringUtils` / `BooleanUtils` | string and boolean type guards |
| `MappingUtils` | null-safe mapping of models, arrays, maps, enums (instance methods) |
| `NumberUtils` | percentages, mean, min/max, rounding with precision |
| `GeoUtils` | haversine distance, degree conversion |
| `DefaultsUtil` | fallbacks for nullable strings and numbers |

Method lists and signatures deliberately live outside this file — in the type declarations,
[the package README](packages/utils/README.md), and the `using-utils` skill that consuming
repos install. Restating them here is how this section came to claim 36 methods in one place
and 39 in another while the real number was 41.

---

## 📋 Decision Trees

### "Should I use tsed-mongoose?"

```
Do you need database persistence?
├─ No → Skip tsed-mongoose
└─ Yes
   └─ Are you using MongoDB?
      ├─ No → Use different ORM (@tsed/prisma, @tsed/typeorm)
      └─ Yes → ✅ Use @radoslavirha/tsed-mongoose
```

### "How many packages do I need?"

```
What are you building?
├─ REST API with MongoDB
│  └─ ✅ platform + configuration + swagger + mongoose + common + utils
├─ REST API without database
│  └─ ✅ platform + configuration + swagger + utils
├─ Background worker with MongoDB
│  └─ ✅ platform + configuration + mongoose + common + utils
└─ Simple microservice (no DB, no docs)
   └─ ✅ platform + configuration + utils
```

---

## 🔗 Quick Links to Package Documentation

### Framework Packages
- [tsed-platform README](tsed/platform/README.md#-quick-reference-for-ai-agents) - Server bootstrap
- [tsed-configuration README](tsed/configuration/README.md#-quick-reference-for-ai-agents) - Config management
- [tsed-swagger README](tsed/swagger/README.md#-quick-reference-for-ai-agents) - API documentation
- [tsed-mongoose README](tsed/mongoose/README.md#-quick-reference-for-ai-agents) - MongoDB integration
- [tsed-common README](tsed/common/README.md#-quick-reference-for-ai-agents) - Base models, serialization & validation

### Utility Packages
- [utils README](packages/utils/README.md#-quick-reference-for-ai-agents) - guards, model building, mapping
- [types README](packages/types/README.md#-quick-reference-for-ai-agents) - TypeScript types

### Config Packages
- [config-eslint README](config/config-eslint/README.md#-quick-reference-for-ai-agents) - ESLint rules
- [config-typescript README](config/config-typescript/README.md#-quick-reference-for-ai-agents) - TypeScript config
- [config-tsdown README](config/config-tsdown/README.md#-quick-reference-for-ai-agents) - Build config
- [config-vitest README](config/config-vitest/README.md#-quick-reference-for-ai-agents) - Test config

---

## 📚 Maintenance

This document is maintained alongside package READMEs:

1. **Package-specific details** → Stay in package READMEs
2. **Cross-package patterns** → Documented here in AGENTS.md
3. **API changes** → Update both README and relevant pattern here
4. **New integration patterns** → Add to this document

**Review Checklist:**
- [ ] When adding new package → Add to Package Overview table
- [ ] When changing API → Update anti-patterns section if relevant
- [ ] When discovering common pattern → Add to Common Integration Patterns
- [ ] Monthly review for accuracy

---
