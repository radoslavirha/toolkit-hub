# @radoslavirha/tsed-common

Base models and common utilities for Ts.ED applications. Provides standardized model patterns with automatic timestamp handling and a typed serialization/deserialization wrapper around `@tsed/json-mapper`.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Base models with standard fields and typed serialization for Ts.ED applications.

**Install in pnpm monorepo:**
```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-common @tsed/schema @tsed/json-mapper @tsed/core
```

**Essential Usage:**
```typescript
import { BaseModel, Serializer, JSONSchemaValidator, ZodValidator } from '@radoslavirha/tsed-common';
import { z } from 'zod';
import { Property } from '@tsed/schema';

// Extend BaseModel for API response models
export class User extends BaseModel {
  @Property()
  name: string;

  @Property()
  email: string;
}

// BaseModel provides: id (string), createdAt (Date), updatedAt (Date)
// All decorated for OpenAPI documentation

// Serialize a model instance to a plain object
const plain = Serializer.serialize(user, User);

// Deserialize a POJO into a typed model instance
const model = Serializer.deserialize(rawPayload, User);

// Deserialize an array of POJOs
const models = Serializer.deserializeArray(rawArray, User);

// Validate and deserialize arbitrary input against a model schema
const validated = JSONSchemaValidator.validate(User, rawPayload);

// Validate arbitrary input against a Zod schema
const UserSchema = z.object({ name: z.string() });
const zodValidated = ZodValidator.validate(UserSchema, rawPayload);
```

**Key Exports:**
- `BaseModel` - Standard fields: `id`, `createdAt`, `updatedAt` (all with @Property, @Format decorators)
- `Serializer` - Typed wrappers for `@tsed/json-mapper`'s `serialize`/`deserialize`
- `JSONSchemaValidator` - AJV-based schema validation of arbitrary input against a Ts.ED model
- `ZodValidator` - Zod-based runtime validation for arbitrary input using any Zod schema
- `SerializeOptions` / `DeserializeOptions` - Option types (omit `type`, which is a required parameter)

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add @radoslavirha/tsed-common

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-common
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@tsed/core` - Required for `Type<T>` used by Serializer
- `@tsed/json-mapper` - Required for serialization/deserialization
- `@tsed/schema` - Required for @Property and @Format decorators
- `zod` - Required only when using `ZodValidator`

**Recommended:**
- `@radoslavirha/utils` - For building model instances with `CommonUtils.buildModel()`

## What's Included

### BaseModel

The foundational model class for all API response models in Ts.ED applications. Provides standard fields that are common across all entities:

- `id` (string) - Unique identifier
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp

All properties are decorated with `@Property` and `@Format` from `@tsed/schema` for automatic OpenAPI documentation generation.

### Serializer

Typed wrappers around `@tsed/json-mapper`'s `serialize` and `deserialize` functions. The native functions accept `type` inside a loose options bag — `Serializer` makes `type` a required first-class parameter, preventing silent data loss.

- `Serializer.serialize(input, type, options?)` - Serialize a model to a plain object
- `Serializer.deserialize(input, type, options?)` - Deserialize a POJO to a model instance
- `Serializer.deserializeArray(input[], type, options?)` - Deserialize an array of POJOs

### JSONSchemaValidator

AJV-based runtime validation of arbitrary input against a Ts.ED model. Useful for validating external data (e.g. configuration files, API payloads) before processing.

- Derives a JSON Schema from `@tsed/schema` decorators at runtime
- Deserializes the input via `Serializer` into a typed model instance
- Validates the deserialized instance with AJV (`allErrors: true`)
- Throws an `ErrorObject[]` array on failure so all violations are surfaced at once

### ZodValidator

Runtime validation of arbitrary input using any Zod schema instance.

- Uses `schema.safeParse(input)` internally
- Returns typed parsed data when validation succeeds
- Throws `ZodError` (with `.issues`) when validation fails
- Optional debug mode logs the raw input

## Usage

### JSONSchemaValidator Usage

Use `JSONSchemaValidator` to validate arbitrary raw input against a Ts.ED model before processing. It combines AJV validation with `Serializer` deserialization in one step.

```typescript
import { JSONSchemaValidator } from '@radoslavirha/tsed-common';
import { Required, Property } from '@tsed/schema';

class CreateUserRequest {
    @Required()
    name!: string;

    @Property()
    age?: number;
}

// Valid – returns a typed CreateUserRequest instance
const request = JSONSchemaValidator.validate(CreateUserRequest, rawBody);

// Invalid – throws ErrorObject[]
try {
    JSONSchemaValidator.validate(CreateUserRequest, { age: 30 });
} catch (errors: unknown) {
    if (Array.isArray(errors)) {
        errors.forEach(e => console.error(e.instancePath, e.message));
    }
}

// With debug logging – logs raw input and generated JSON Schema
JSONSchemaValidator.validate(CreateUserRequest, rawBody, true);
```

### ZodValidator Usage

Use `ZodValidator` when your project already defines validation contracts with Zod schemas.

```typescript
import { ZodValidator } from '@radoslavirha/tsed-common';
import { z } from 'zod';

const MqttConfigSchema = z.union([
  z.object({ enabled: z.literal(true), url: z.string() }),
  z.object({ enabled: z.literal(false).optional(), url: z.string().optional() })
]);

type MqttConfig = z.infer<typeof MqttConfigSchema>;

// Valid - returns a typed MqttConfig
const config = ZodValidator.validate(MqttConfigSchema, { enabled: true, url: 'mqtt://host' });

// Invalid - throws ZodError
try {
  ZodValidator.validate(MqttConfigSchema, { enabled: true });
} catch (error: unknown) {
  if (error instanceof z.ZodError) {
    error.issues.forEach(issue => console.error(issue.path.join('.'), issue.message));
  }
}

// With debug logging - logs raw input to console
ZodValidator.validate(MqttConfigSchema, config, true);
```

### Serializer Usage

Use `Serializer` wherever you need to convert between Ts.ED model instances and plain JSON-compatible objects. The `type` option is required and passed as a separate parameter so TypeScript enforces it.

```typescript
import { Serializer } from '@radoslavirha/tsed-common';
import { UserModel } from './UserModel.js';

// Serialize a model instance → plain object (e.g. before storing or sending)
const plain = Serializer.serialize(userModel, UserModel);

// Deserialize a POJO → model instance (e.g. from API response or cache)
const model = Serializer.deserialize(rawApiResponse, UserModel);

// Deserialize an array of POJOs → model instances
const models = Serializer.deserializeArray(rawArray, UserModel);

// Extra options (useAlias, groups) pass through to @tsed/json-mapper
const aliased = Serializer.serialize(model, UserModel, { useAlias: true });
const grouped = Serializer.deserialize(raw, UserModel, { groups: ['public'] });
```

### Basic Model Extension

Extend `BaseModel` to create your API response models:

```typescript
import { BaseModel } from '@radoslavirha/tsed-common';
import { Property } from '@tsed/schema';

export class UserModel extends BaseModel {
    @Property()
    public name: string;

    @Property()
    public email: string;

    @Property()
    public role: string;
}
```

### API Response

Use in Ts.ED controllers to return standardized responses:

```typescript
import { Controller } from '@tsed/di';
import { Get, Returns, PathParams } from '@tsed/schema';
import { CommonUtils } from '@radoslavirha/utils';
import { UserModel } from './models/UserModel';

@Controller('/users')
export class UserController {
    @Get('/:id')
    @Returns(200, UserModel)
    async getUser(@PathParams('id') id: string): Promise<UserModel> {
        // Use CommonUtils.buildModel for clean instance creation
        return CommonUtils.buildModel(UserModel, {
            id,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
}
```

### Integration with Mongoose

When using MongoDB, `BaseModel` serves as the API layer model. Use [@radoslavirha/tsed-mongoose](../mongoose/) to map between Mongoose documents and BaseModel instances:

```typescript
import { BaseModel } from '@radoslavirha/tsed-common';
import { BaseMongo } from '@radoslavirha/tsed-mongoose';

// Database schema
export class UserMongo extends BaseMongo {
    public name: string;
    public email: string;
}

// API response model
export class UserModel extends BaseModel {
    public name: string;
    public email: string;
}
```

## API Reference

### BaseModel

**Properties:**

- `id: string` - Unique identifier for the entity
- `createdAt: Date` - Timestamp when the entity was created (decorated with `@Format('date-time')`)
- `updatedAt: Date` - Timestamp when the entity was last updated (decorated with `@Format('date-time')`)

**Decorators:**

All properties use `@Property` from `@tsed/schema` for automatic Swagger/OpenAPI documentation.

### Serializer

Static utility class wrapping `@tsed/json-mapper`.

**Methods:**

- `serialize<T extends object>(input: T, type: Type<T>, options?: SerializeOptions): object`  
  Serializes a Ts.ED model instance to a plain JSON-compatible object.

- `deserialize<T extends object>(input: object, type: Type<T>, options?: DeserializeOptions): T`  
  Deserializes a plain object into a typed Ts.ED model instance.

- `deserializeArray<T extends object>(input: object[], type: Type<T>, options?: DeserializeOptions): T[]`  
  Deserializes an array of plain objects into an array of typed model instances.

**Types:**

- `SerializeOptions` - `JsonSerializerOptions` minus `type` (e.g. `useAlias`, `groups`)
- `DeserializeOptions` - `JsonDeserializerOptions` minus `type` (e.g. `useAlias`, `groups`, `generics`)

### JSONSchemaValidator

**Methods:**

- `validate<T>(model: Type<T>, input: unknown, debug?: boolean): T`  
  Validates and deserializes `input` against the JSON Schema derived from `model`. Returns a typed `T` instance on success; throws `ErrorObject[]` on validation failure.

**Parameters:**

- `model` - Ts.ED model class decorated with `@tsed/schema` decorators (e.g. `@Required`, `@Property`)
- `input` - Arbitrary raw value to validate (typically a plain object from parsed JSON)
- `debug` *(optional, default `false`)* - When `true`, logs the serialized input (`'Raw data:'`) and generated JSON Schema (`'Generated JSON Schema:'`) to `console.log`

**Throws:** `ErrorObject[]` (AJV) - Array of all validation errors when the input does not match the schema. All errors are collected before throwing (`allErrors: true`).

### ZodValidator

**Methods:**

- `validate<T extends object>(schema: ZodType<T>, input: unknown, debug?: boolean): T`
  Validates `input` against the provided Zod `schema`. Returns parsed `T` on success; throws `ZodError` on failure.

**Parameters:**

- `schema` - Any Zod schema instance (for example `z.object(...)`, `z.union([...])`)
- `input` - Arbitrary raw value to validate
- `debug` *(optional, default `false`)* - When `true`, logs the serialized raw input (`'Raw data:'`) to `console.log`

**Throws:** `ZodError` - Zod validation error containing a detailed `.issues` array.

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/utils](../../packages/utils/) - Use `CommonUtils.buildModel()` for creating model instances
- [@radoslavirha/tsed-mongoose](../mongoose/) - Mongoose integration with mapping utilities
- [@radoslavirha/tsed-platform](../platform/) - Base server setup
- [@radoslavirha/tsed-swagger](../swagger/) - API documentation
- [@tsed/json-mapper](https://tsed.io/docs/json-mapper.html) - Underlying serialization engine
