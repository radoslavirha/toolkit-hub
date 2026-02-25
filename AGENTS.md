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
| [@radoslavirha/tsed-common](tsed/common/) | Base models & typed serialization utilities | When using Ts.ED models or tsed-mongoose |

### Utility Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/utils](packages/utils/) | 36 common utility methods | **Always** - When you need common operations (don't reinvent the wheel) for e.g. numeric, string, object operations and more |
| [@radoslavirha/types](packages/types/) | TypeScript utility types (`Dictionary`, `EnumDictionary`, `NullableProperty`, `FullPartial`) | When you need common reusable types or to avoid lodash type imports |

### Configuration Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/config-typescript](config/config-typescript/) | Shared TypeScript config | **Always** - Base tsconfig for all packages |
| [@radoslavirha/config-eslint](config/config-eslint/) | Shared ESLint config | **Always** - Consistent linting rules |
| [@radoslavirha/config-tsup](config/config-tsup/) | Build configuration with tsup | When building library packages (not apps) |
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

// 2. Inject via constructor
@Injectable()
export class Service extends MongoService<MongoModel, Model> {
  @Inject(MongoModel)
  protected model!: MongooseModel<MongoModel>;

  @Inject(Mapper)
  protected mapper!: Mapper;
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
@Injectable()
export class ConfigService extends ConfigProvider<ConfigModel> {
  public static readonly options: ConfigProviderOptions<ConfigModel> = {
    configModel: ConfigModel
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

const swaggerConfig = CommonUtils.buildModel(SwaggerConfig, {
  title: config.api.service,
  version: config.api.version,
  description: config.api.description,
  documents: [
    CommonUtils.buildModel(SwaggerDocumentConfig, {
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
import { BaseModel, Serializer } from '@radoslavirha/tsed-common';

export class Model extends BaseModel {
  @Property() name: string;
  @Property() email: string;
}

// 5. Mapper (tsed-mongoose + utils)
import { MongoMapper } from '@radoslavirha/tsed-mongoose';
import { CommonUtils } from '@radoslavirha/utils';

@Injectable()
export class Mapper extends MongoMapper<MongoModel, Model> {
  async mongoToModel(mongo: MongoModel): Promise<Model> {
    const model = new Model();
    this.mongoToModelBase(model, mongo);
    model.name = mongo.name;
    model.email = mongo.email;
    return model;
  }
  
  async modelToMongoCreateObject(model: Model): Promise<MongoosePlainObjectCreate<MongoModel>> {
    const mongo = new MongoModel() as MongoPlainObjectCreate<MongoModel>;
    mongo.name = this.getModelValue(model, 'name');
    mongo.email = this.getModelValue(model, 'email');
    return serialize(mongo);
  }
  
  async modelToMongoUpdateObject(model: Model): Promise<MongoosePlainObjectUpdate<MongoModel>> {
    const mongo = new MongoModel() as MongoPlainObjectUpdate<MongoModel>;
    mongo.name = this.getModelValue(model, 'name', true);
    mongo.email = this.getModelValue(model, 'email', true);
    return serialize(mongo);
  }
}

// 6. Service (tsed-mongoose)
import { MongoService } from '@radoslavirha/tsed-mongoose';

@Injectable()
export class Service extends MongoService<MongoModel, Model> {
  @Inject(MongoModel)
  protected model!: MongooseModel<MongoModel>;

  @Inject(Mapper)
  protected mapper!: Mapper;
}

// 7. Controller (tsed-swagger)
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

❌ **WRONG:**
```typescript
class Mapper extends MongoMapper<MongoModel, Model> {
  toModel(doc) { ... } // Wrong method name
  toMongo(model) { ... } // Wrong method name
}
```

✅ **CORRECT:**
```typescript
class Mapper extends MongoMapper<MongoModel, Model> {
  async mongoToModel(mongo: MongoModel): Promise<Model> { ... }
  async modelToMongoCreateObject(model: Model): Promise<MongoosePlainObjectCreate<MongoModel>> { ... }
  async modelToMongoUpdateObject(model: Model): Promise<MongoosePlainObjectUpdate<MongoModel>> { ... }
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
  CommonUtils.buildModel(SwaggerDocumentConfig, {
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

### Configuration Model Pattern

```typescript
// config/ConfigModel.ts
import { BaseConfig } from '@radoslavirha/tsed-configuration';
export class ConfigModel extends BaseConfig {
  @Property() server: ServerConfig;
  @Property() api: APIConfig;
  @Property() mongo: MongoConfig;
}

// config/ConfigService.ts
import { ConfigProvider, ConfigProviderOptions } from '@radoslavirha/tsed-configuration';
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

---

## 🛠️ Utilities Quick Reference

### @radoslavirha/utils - All 36 Methods

**CommonUtils (8 methods):**
- `isEmpty<T>(value: T): boolean` - Check if empty (objects, arrays, strings, maps, sets, null/undefined)
- `isNil<T>(value: T): boolean` - Check if null or undefined (type guard)
- `notNil<T>(value: T): boolean` - Check if NOT null/undefined (type guard)
- `isNull<T>(value: T): boolean` - Check if null (type guard)
- `notNull<T>(value: T): boolean` - Check if NOT null (type guard)
- `isUndefined<T>(value: T): boolean` - Check if undefined (type guard)
- `notUndefined<T>(value: T): boolean` - Check if NOT undefined (type guard)
- `buildModel<T>(type: new() => T, data: Partial<T>): T` - Type-safe model construction

**ObjectUtils (6 methods):**
- `isObject<T>(value: T): value is Extract<T, object>` - Check if value is any object type (includes arrays, functions, class instances)
- `isPlainObject<T>(value: T): value is Extract<T, Record<string, unknown>>` - Check if value is a plain object (POJO only, excludes arrays/functions)
- `keys<T extends object>(object: T | null | undefined): Array<Extract<keyof T, string>>` - Get typed object keys
- `keys<T>(object: Dictionary<T> | null | undefined): string[]` - Get dictionary keys (`Dictionary` from `@radoslavirha/types`)
- `values<T extends object>(object: T | null | undefined): Array<T[keyof T]>` - Get typed object/enum values
- `values<T>(object: Dictionary<T> | null | undefined): T[]` - Get dictionary values
- `cloneDeep<T extends object>(object: T): T` - Deep clone with no shared references
- `mergeDeep<T extends object, S extends object>(target: T, source: S): T & S` - Deep merge (arrays concatenate)

**ArrayUtils (2 methods):**
- `isArray<T>(value: T): value is Extract<T, unknown[]>` - Check if value is an array (type guard)
- `toArray<T>(value: T | T[] | undefined | null): T[]` - Convert value to array; returns `[]` for null/undefined, wraps single value, passes through arrays

**BooleanUtils (1 method):**
- `isBoolean<T>(value: T): value is Extract<T, boolean>` - Check if value is a boolean primitive (type guard)

**StringUtils (1 method):**
- `isString<T>(value: T): value is Extract<T, string>` - Check if value is a string primitive or String object (type guard)

**MappingUtils (7 methods):**
- `mapOptionalModel<TValue extends object | null | undefined, TOut, TArgs extends unknown[] = []>(model: TValue, mapper: (model: NonNullable<TValue>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut>>` - Map optional model while preserving nullability
- `mapArray<TValue extends unknown[] | null, TOut, TArgs extends unknown[] = []>(models: TValue, mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut[]>>` - Map array with null support
- `mapOptionalArray<TValue extends unknown[] | null | undefined, TOut, TArgs extends unknown[] = []>(models: TValue, mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut[]>>` - Map optional array with null/undefined support
- `mapMap<TValue extends Map<unknown, unknown> | null, TKeyOut, TValueOut>(source: TValue, mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>): Promise<Result<TValue, Map<TKeyOut, TValueOut>>>` - Map Map entries with null support
- `mapOptionalMap<TValue extends Map<unknown, unknown> | null | undefined, TKeyOut, TValueOut>(source: TValue, mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>): Promise<Result<TValue, Map<TKeyOut, TValueOut>>>` - Map optional Map entries
- `mapEnum<TSource extends Record<string, string | number>, TTarget extends Record<string, string | number>, TValue extends TSource[keyof TSource] | null>(sourceTypeObject: Record<string, TSource>, targetTypeObject: Record<string, TTarget>, value: TValue, ignoreUnknownKeys?: boolean): Result<TValue, TTarget[keyof TTarget]>` - Map enum values by matching source key name
- `mapOptionalEnum<TSource extends Record<string, string | number>, TTarget extends Record<string, string | number>, TValue extends TSource[keyof TSource] | null | undefined>(sourceTypeObject: Record<string, TSource>, targetTypeObject: Record<string, TTarget>, value: TValue, ignoreUnknownKeys?: boolean): Result<TValue, TTarget[keyof TTarget]>` - Map optional enum values with null/undefined support

**NumberUtils (8 methods):**
- `getPercentFromValue(maxValue: number, value: number): number` - Calculate percentage
- `getValueFromPercent(maxValue: number, percent: number): number` - Get value from percentage
- `mean(values: number[]): number` - Calculate average
- `round(value: number, precision?: number): number` - Round to decimal places
- `floor(value: number, precision?: number): number` - Floor to decimal places
- `ceil(value: number, precision?: number): number` - Ceil to decimal places
- `min(values: number[]): number | undefined` - Find minimum value
- `max(values: number[]): number | undefined` - Find maximum value

**GeoUtils (2 methods):**
- `calculateKmBetweenCoordinates(lat1: number, lng1: number, lat2: number, lng2: number): number` - Haversine distance in kilometers
- `degToRad(deg: number): number` - Convert degrees to radians

**DefaultsUtil (2 methods):**
- `string(string: string | null | undefined, defaultValue: string): string` - Default if empty/null/undefined
- `number(number: number | null | undefined, defaultValue: number): number` - Default if null/undefined

**Usage:**
```typescript
import { CommonUtils, NumberUtils, GeoUtils, ObjectUtils, MappingUtils, ArrayUtils, BooleanUtils, StringUtils, DefaultsUtil } from '@radoslavirha/utils';

// Type-safe model creation
const config = CommonUtils.buildModel(SwaggerConfig, { title: 'API' });

// Type guards
if (CommonUtils.notNil(value)) {
  // TypeScript knows value is not null or undefined
}

// Math operations
const rounded = NumberUtils.round(3.14159, 2); // 3.14
const percent = NumberUtils.getPercentFromValue(200, 50); // 25
const average = NumberUtils.mean([1, 2, 3, 4, 5]); // 3

// Object operations
ObjectUtils.isObject(value);          // true for objects, arrays, functions
ObjectUtils.isPlainObject(value);     // true for plain POJOs only
const keys = ObjectUtils.keys(config);
const vals = ObjectUtils.values(config);
const clone = ObjectUtils.cloneDeep(original);
const merged = ObjectUtils.mergeDeep(target, source);

// Array operations
ArrayUtils.isArray(value);            // type guard for arrays
ArrayUtils.toArray(value);            // always returns T[]

// Type checks
BooleanUtils.isBoolean(value);        // type guard for booleans
StringUtils.isString(value);          // type guard for strings

// Mapping operations
const mappingUtils = new MappingUtils();
const mappedModel = await mappingUtils.mapOptionalModel(model, async (item) => ({ id: item.id }));
const mappedArray = await mappingUtils.mapArray([1, 2, 3], async (value) => value * 2);

// Geospatial (NY to London)
const distance = GeoUtils.calculateKmBetweenCoordinates(
  40.7128, -74.0060,
  51.5074, -0.1278
); // ~5570.22 km

// Defaults
const name = DefaultsUtil.string(user.name, 'Anonymous');
const port = DefaultsUtil.number(config.port, 3000);
```

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
- [tsed-common README](tsed/common/README.md#-quick-reference-for-ai-agents) - Base models & serialization

### Utility Packages
- [utils README](packages/utils/README.md#-quick-reference-for-ai-agents) - 22 utility methods
- [types README](packages/types/README.md#-quick-reference-for-ai-agents) - TypeScript types

### Config Packages
- [config-eslint README](config/config-eslint/README.md#-quick-reference-for-ai-agents) - ESLint rules
- [config-typescript README](config/config-typescript/README.md#-quick-reference-for-ai-agents) - TypeScript config
- [config-tsup README](config/config-tsup/README.md#-quick-reference-for-ai-agents) - Build config
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
