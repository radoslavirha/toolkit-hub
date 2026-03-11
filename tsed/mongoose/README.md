# @radoslavirha/tsed-mongoose

Mongoose integration utilities for Ts.ED applications providing a clean architecture pattern for MongoDB integration. This package enforces separation between database schemas (Mongoose models) and API models through abstract mapper and service base classes. It provides type-safe bidirectional mapping, automatic population handling, and reusable CRUD patterns for building scalable microservices with clean layered architecture.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Clean architecture MongoDB integration with Mongoose for Ts.ED applications.

**Install in pnpm monorepo:**
```bash
# From repository root
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-mongoose @radoslavirha/tsed-common @tsed/core @tsed/mongoose @tsed/schema mongoose
```

**Essential Pattern:**
```typescript
import { CommonUtils } from '@radoslavirha/utils';

// 1. Mongoose Schema
@Model({ collection: 'entities', timestamps: true })
class EntityMongo extends BaseMongo { @Property() name: string; }

// 2. API Model
class Entity extends BaseModel { @Property() name: string; }

// 3. Mapper  — declare protected mongo + model, use new helpers
@Injectable()
class EntityMapper extends MongoMapper<EntityMongo, Entity> {
  protected mongo = EntityMongo;
  protected model = Entity;

  public mongoToModel(mongo: EntityMongo): Entity {
    return CommonUtils.buildModelStrict(Entity, {
      ...this.mongoToModelBase(mongo),   // spreads id, createdAt, updatedAt
      name: mongo.name,
    });
  }

  public buildMongoCreate(model: Entity): MongoCreate<EntityMongo> {
    return this.buildMongoPayload({
      name: this.getModelValue(model, 'name'),  // falls back to @Default if undefined
    });
  }

  public buildMongoUpdate(model: Entity): MongoUpdate<EntityMongo> {
    return this.buildMongoUpdatePayload({
      name: this.getModelValue(model, 'name', true),  // patch=true → skip default
    });
  }
}

// 4. Repository  — declare protected mongo (not type)
@Injectable()
class EntityRepository extends MongoRepository<EntityMongo> {
  @Inject(EntityMongo) protected model!: MongooseModel<EntityMongo>;
  protected mongo = EntityMongo;  // ← formerly called 'type'

  async findById(id: string): Promise<EntityMongo | null> {
    return this.deserialize(await this.model.findById(id).lean<EntityMongo>());
  }
  async find(): Promise<EntityMongo[]> {
    return this.deserializeArray(await this.model.find().lean<EntityMongo[]>());
  }
  async create(data: MongoCreate<EntityMongo>): Promise<EntityMongo> {
    const doc = await this.model.create(data);
    return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
  }
}

// 5. Service  — plain @Injectable(), wire repository + mapper manually
@Injectable()
class EntityService {
  @Inject(EntityRepository) private repository!: EntityRepository;
  @Inject(EntityMapper) private mapper!: EntityMapper;

  async findAll(): Promise<Entity[]> {
    return (await this.repository.find()).map(m => this.mapper.mongoToModel(m));
  }
  async findById(id: string): Promise<Entity | null> {
    const mongo = await this.repository.findById(id);
    return mongo ? this.mapper.mongoToModel(mongo) : null;
  }
  async create(model: Entity): Promise<Entity> {
    const mongo = await this.repository.create(this.mapper.buildMongoCreate(model));
    return this.mapper.mongoToModel(mongo);
  }
  async update(id: string, model: Entity): Promise<Entity | null> {
    const mongo = await this.repository.findByIdAndUpdate(id, this.mapper.buildMongoUpdate(model));
    return mongo ? this.mapper.mongoToModel(mongo) : null;
  }
}

// 6. Controller
@Controller('/entities')
class EntityController {
  constructor(private service: EntityService) {}
  @Get('/') getAll() { return this.service.findAll(); }
  @Post('/') create(@BodyParams() data: Entity) { return this.service.create(data); }
}
```

**Key Classes:**
- `BaseMongo` - Base schema (`_id`, `createdAt`, `updatedAt`)
- `MongoMapper<MONGO, MODEL>` - Abstract bidirectional mapper with helpers
- `MongoRepository<MONGO>` - Abstract repository for DB operations

**Full documentation below** ↓

---

## Installation

```bash
# Install the package
pnpm add @radoslavirha/tsed-mongoose

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-mongoose

# Install peer dependencies
pnpm add @radoslavirha/tsed-common @tsed/core @tsed/mongoose @tsed/schema mongoose
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@radoslavirha/tsed-common` - Base API models (BaseModel)
- `@tsed/core` - Ts.ED core utilities
- `@tsed/mongoose` - Ts.ED's Mongoose integration and decorators
- `@tsed/schema` - Schema and validation decorators
- `mongoose` - MongoDB object modeling library

## What's Included

### Core Classes

- **`BaseMongo`** - Base Mongoose schema with `_id`, `createdAt`, `updatedAt`
- **`MongoMapper<MONGO, MODEL>`** - Abstract mapper for bidirectional conversions with payload-building helpers
- **`MongoRepository<MONGO>`** - Abstract base repository for DB operations

### Type Utilities

- **`MongoCreate<T>`** - Strictly-typed create payload (strictly forbids `id`, `_id`, `createdAt`, `updatedAt`)
- **`MongoUpdate<T>`** - Strictly-typed update payload (strictly forbids `id`, `_id`, `createdAt`, `updatedAt`)
- **`MongoFilter<T>`** - Filter type for repository queries
- **`MongoDeleteResult`** - Typed result from delete operations
- **`MongoUpdateResult`** - Typed result from count-based update operations
- **`MongoConfigSchema`** / **`MongoConfig`** - Zod schema and TypeScript type for MongoDB connection config

## Architecture Pattern

This package enforces a clean architecture pattern with clear separation of concerns:

```
Controller (HTTP Layer)
    ↓
Service (Business Logic)
    ↓                   ↓
Mapper              Repository
(Transformation)    (Data Access)
    ↓                   ↓
API Model       Mongoose Model (Data Layer)
                         ↓
                   MongoDB Database
```

**Data Flow:**
- **Inbound:** Database → Mongoose Document → `mapper.mongoToModel()` → API Model → Controller → Response
- **Outbound:** Request → Controller → API Model → `mapper.buildMongoCreate/Update()` → Repository → MongoDB

**Benefits:**
- ✅ **Separation of Concerns:** API models are independent from database schemas
- ✅ **Type Safety:** Compile-time type checking for all transformations
- ✅ **Reusability:** Abstract base classes eliminate boilerplate
- ✅ **Testability:** Easy to mock mappers and repositories
- ✅ **Population Handling:** Automatic handling of Mongoose populated references
- ✅ **Immutability Protection:** Create/update types prevent modification of system-managed fields

## Usage

This package provides three base classes that work together to create a complete data access layer. Follow these steps to implement the pattern in your Ts.ED application.

### 1. Define Mongoose Schema (Database Layer)

Create a Mongoose schema that represents your database collection structure. All schemas should extend `BaseMongo` to get standard fields (`_id`, `createdAt`, `updatedAt`).

```typescript
import { Model, ObjectID, Property } from '@tsed/mongoose';
import { BaseMongo } from '@radoslavirha/tsed-mongoose';

@Model({ collection: 'users', timestamps: true })
export class UserMongo extends BaseMongo {
    @Property()
    public name: string;

    @Property()
    public email: string;

    @Property()
    public role: string;
}
```

**Key Points:**
- Use `@Model()` decorator with collection name
- Set `timestamps: true` to auto-manage `createdAt` and `updatedAt`
- Extend `BaseMongo` for standard fields
- Use `@Property()` for all fields

### 2. Define API Model (Presentation Layer)

Create an API model that represents the data structure exposed through your REST API. API models should extend `BaseModel` from `@radoslavirha/tsed-common`.

```typescript
import { BaseModel } from '@radoslavirha/tsed-common';
import { Property, Required, Email } from '@tsed/schema';

export class UserModel extends BaseModel {
    @Required()
    @Property()
    public name: string;

    @Required()
    @Email()
    @Property()
    public email: string;

    @Property()
    public role: string;
}
```

**Key Points:**
- Use Ts.ED schema decorators for validation (`@Required`, `@Email`, etc.)
- API models can differ from DB schemas (different field names, computed properties, etc.)
- Extend `BaseModel` to get standard fields (`id`, `createdAt`, `updatedAt`)

### 3. Implement Mapper (Transformation Layer)

Create a mapper to handle bidirectional conversion between Mongoose documents and API models. You must:
- Declare `protected mongo` and `protected model` pointing to the class constructors
- Implement `mongoToModel` using `mongoToModelBase` spread pattern
- Add `buildMongoCreate` and `buildMongoUpdate` methods using the `buildMongoPayload` / `buildMongoUpdatePayload` helpers

```typescript
import { Injectable } from '@tsed/di';
import { MongoMapper, MongoCreate, MongoUpdate } from '@radoslavirha/tsed-mongoose';
import { CommonUtils } from '@radoslavirha/utils';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';

@Injectable()
export class UserMapper extends MongoMapper<UserMongo, UserModel> {
    // Required: declare class constructors so MapperBase can resolve defaults & types
    protected mongo = UserMongo;
    protected model = UserModel;

    /**
     * Convert Mongoose document → API model (reads).
     *
     * Use mongoToModelBase() to spread id/createdAt/updatedAt, then add every
     * domain field explicitly. buildModelStrict gives compile-time exhaustiveness:
     * TypeScript errors if you forget a required field.
     */
    public mongoToModel(mongo: UserMongo): UserModel {
        return CommonUtils.buildModelStrict(UserModel, {
            ...this.mongoToModelBase(mongo),  // id, createdAt, updatedAt
            name: mongo.name,
            email: mongo.email,
            role: mongo.role,
        });
    }

    /**
     * Build a create payload (POST / inserts).
     *
     * buildMongoPayload wraps buildModelPartial and enforces MongoCreate<UserMongo>
     * at the type level, so base fields (id, _id, createdAt, updatedAt) are
     * compile-time forbidden.
     *
     * getModelValue(model, 'field') returns the field value, or falls back to the
     * @Default() schema decorator value when the field is undefined.
     */
    public buildMongoCreate(model: UserModel): MongoCreate<UserMongo> {
        return this.buildMongoPayload({
            name: this.getModelValue(model, 'name'),
            email: this.getModelValue(model, 'email'),
            role: this.getModelValue(model, 'role'),  // uses @Default if undefined
        });
    }

    /**
     * Build an update payload (PATCH / partial updates).
     *
     * Pass patch=true as the third argument to getModelValue so that undefined
     * fields are left out of the payload completely instead of being replaced
     * with the schema default.
     */
    public buildMongoUpdate(model: UserModel): MongoUpdate<UserMongo> {
        return this.buildMongoUpdatePayload({
            name: this.getModelValue(model, 'name', true),
            email: this.getModelValue(model, 'email', true),
            role: this.getModelValue(model, 'role', true),
        });
    }
}
```

**Key Points:**
- Declare `protected mongo = YourMongoClass` and `protected model = YourModelClass` — used internally for typing and default resolution
- `mongoToModelBase(mongo)` **returns** the base fields; spread it into `buildModelStrict` — TypeScript errors if any required domain field is missing
- `buildMongoPayload` / `buildMongoUpdatePayload` wrap `buildModelPartial` and return a correctly typed `MongoCreate<MONGO>` / `MongoUpdate<MONGO>` without unsafe casts in your code
- `getModelValue(model, 'field')` — returns the value or falls back to `@Default()` from the schema (for POST)
- `getModelValue(model, 'field', true)` — returns the value or `undefined` (no default fallback, for PATCH)

### 4. Implement Repository (Data Access Layer)

Create a repository that owns all direct Mongoose queries. The repository must inject the Mongoose model, declare the document type via `protected mongo`, and expose only the data-access methods your domain needs. Use `.lean()` for performance and call the built-in `deserialize()`/`deserializeArray()` helpers to get typed class instances back.

```typescript
import { Injectable, Inject } from '@tsed/di';
import type { MongooseModel } from '@tsed/mongoose';
import {
    MongoRepository, MongoCreate, MongoUpdate, MongoFilter,
    MongoDeleteResult, MongoUpdateResult
} from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';

@Injectable()
export class UserRepository extends MongoRepository<UserMongo> {
    @Inject(UserMongo)
    protected model!: MongooseModel<UserMongo>;

    // Declares the class constructor for deserialization  (formerly named 'type')
    protected mongo = UserMongo;

    async findById(id: string): Promise<UserMongo | null> {
        const result = await this.model.findById(id).lean<UserMongo>();
        return this.deserialize(result);
    }

    async findAll(): Promise<UserMongo[]> {
        const results = await this.model.find().lean<UserMongo[]>();
        return this.deserializeArray(results);
    }

    async create(data: MongoCreate<UserMongo>): Promise<UserMongo> {
        // model.create() does not support .lean() — use the helper
        const doc = await this.model.create(data);
        return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
    }

    async findByIdAndUpdate(id: string, data: MongoUpdate<UserMongo>): Promise<UserMongo | null> {
        const result = await this.model
            .findByIdAndUpdate(id, { $set: data }, { new: true })
            .lean<UserMongo>();
        return this.deserialize(result);
    }

    async deleteById(id: string): Promise<MongoDeleteResult> {
        const result = await this.model.deleteOne({ _id: id } satisfies MongoFilter<UserMongo>);
        return { deleted: result.deletedCount > 0, deletedCount: result.deletedCount };
    }
}
```

**Key Points:**
- Inject the Mongoose model with `@Inject(UserMongo)` and declare `protected mongo` (not `type`) pointing to the class constructor
- Use `.lean()` on all read queries for performance — results are plain objects
- Call `deserialize()` / `deserializeArray()` to reconstruct typed class instances
- Call `convertHydratedDocumentToObject()` after `model.create()` (which doesn't support `.lean()`)
- Business/mapping logic does NOT belong here — keep queries data-access only

### 5. Implement Service (Business Logic Layer)

Create a plain `@Injectable()` service that injects the repository and mapper. There is no base class — you compose repository and mapper calls directly to implement your business logic.

```typescript
import { Injectable, Inject } from '@tsed/di';
import { MongoDeleteResult } from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';
import { UserMapper } from './UserMapper';
import { UserRepository } from './UserRepository';

@Injectable()
export class UserService {
    @Inject(UserRepository)
    private repository!: UserRepository;

    @Inject(UserMapper)
    private mapper!: UserMapper;

    /**
     * Find user by ID — returns null when not found.
     */
    async findById(id: string): Promise<UserModel | null> {
        const mongo = await this.repository.findById(id);
        return mongo ? this.mapper.mongoToModel(mongo) : null;
    }

    /**
     * Find all users.
     */
    async findAll(): Promise<UserModel[]> {
        const mongos = await this.repository.findAll();
        return mongos.map(m => this.mapper.mongoToModel(m));
    }

    /**
     * Create a new user.
     * mapper.buildMongoCreate builds the payload, enforcing MongoCreate<UserMongo>.
     */
    async create(model: UserModel): Promise<UserModel> {
        const payload = this.mapper.buildMongoCreate(model);
        const mongo = await this.repository.create(payload);
        return this.mapper.mongoToModel(mongo);
    }

    /**
     * Update an existing user.
     * mapper.buildMongoUpdate builds the partial payload, enforcing MongoUpdate<UserMongo>.
     */
    async update(id: string, model: UserModel): Promise<UserModel | null> {
        const payload = this.mapper.buildMongoUpdate(model);
        const mongo = await this.repository.findByIdAndUpdate(id, payload);
        return mongo ? this.mapper.mongoToModel(mongo) : null;
    }

    /**
     * Delete user by ID.
     */
    async delete(id: string): Promise<MongoDeleteResult> {
        return this.repository.deleteById(id);
    }
}
```

**Key Points:**
- Annotate with `@Injectable()` — no base class to extend
- Inject `@Inject(UserRepository)` and `@Inject(UserMapper)` as private fields
- Call `mapper.buildMongoCreate(model)` / `mapper.buildMongoUpdate(model)` to get typed payloads
- Call `mapper.mongoToModel(mongo)` to convert results to API models
- The service owns all null-handling and orchestration logic

### 6. Use in Controller (HTTP Layer)

Use the service in your Ts.ED controller to expose REST API endpoints.

```typescript
import { Controller, Inject } from '@tsed/di';
import { Get, Post, Put, Delete, Returns } from '@tsed/schema';
import { BodyParams, PathParams } from '@tsed/platform-params';
import { UserModel } from './UserModel';
import { UserService } from './UserService';

@Controller('/users')
export class UserController {
    @Inject()
    private userService: UserService;

    @Get('/')
    @Returns(200, Array).Of(UserModel)
    async getAll(): Promise<UserModel[]> {
        return this.userService.findAll();
    }

    @Get('/:id')
    @Returns(200, UserModel)
    @Returns(404).Description('User not found')
    async getOne(@PathParams('id') id: string): Promise<UserModel | null> {
        return this.userService.findById(id);
    }

    @Post('/')
    @Returns(201, UserModel)
    async create(@BodyParams() user: UserModel): Promise<UserModel> {
        return this.userService.create(user);
    }

    @Put('/:id')
    @Returns(200, UserModel)
    @Returns(404).Description('User not found')
    async update(
        @PathParams('id') id: string,
        @BodyParams() user: UserModel
    ): Promise<UserModel | null> {
        return this.userService.update(id, user);
    }

    @Delete('/:id')
    @Returns(204).Description('User deleted successfully')
    @Returns(404).Description('User not found')
    async delete(@PathParams('id') id: string): Promise<void> {
        await this.userService.delete(id);
    }
}
```

**Key Points:**
- Use Ts.ED decorators for routing and OpenAPI documentation
- Use `@Returns()` for response type definitions
- Controller only handles HTTP concerns, delegates business logic to service

## API Reference

### BaseMongo

Base class for all Mongoose schemas. Provides standard fields that all documents should have.

**Properties:**
- `_id: ObjectID` - MongoDB document ID (automatically mapped to `id` via `@ObjectID('id')`)
- `createdAt: Date` - Creation timestamp (auto-managed when `timestamps: true`)
- `updatedAt: Date` - Last update timestamp (auto-managed when `timestamps: true`)

**Usage:**
```typescript
import { Model } from '@tsed/mongoose';
import { BaseMongo } from '@radoslavirha/tsed-mongoose';

@Model({ collection: 'items', timestamps: true })
export class ItemMongo extends BaseMongo {
    // Your custom fields here
}
```

---

### MongoMapper<MONGO, MODEL>

Abstract class for bidirectional mapping between Mongoose documents and API models. Extends `MappingUtils` from `@radoslavirha/utils`.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class
- `MODEL extends BaseModel` - Your API model class (from `@radoslavirha/tsed-common`)

**Abstract Properties (must declare):**

#### `protected abstract mongo: Type<MONGO>`
The Mongoose document class constructor. Used internally by `buildMongoPayload` / `buildMongoUpdatePayload` and default resolution.

```typescript
protected mongo = UserMongo;
```

#### `protected abstract model: Type<MODEL>`
The application model class constructor. Used internally by `mongoToModelBase` for result typing.

```typescript
protected model = UserModel;
```

**Method to implement:**

#### `mongoToModel(mongo: MONGO): MODEL`
Converts a Mongoose document to an API model (used for read operations). Use `mongoToModelBase` spread + `CommonUtils.buildModelStrict` for compile-time exhaustiveness checking.

```typescript
public mongoToModel(mongo: UserMongo): UserModel {
    return CommonUtils.buildModelStrict(UserModel, {
        ...this.mongoToModelBase(mongo),  // id, createdAt, updatedAt
        name: mongo.name,
        email: mongo.email,
    });
}
```

**Helper Methods:**

#### `public mongoToModelBase(mongo: MONGO): Pick<MODEL, 'id' | 'createdAt' | 'updatedAt'>`
Maps the three base fields (`id`, `createdAt`, `updatedAt`) from a Mongoose document and returns them as a plain object. Designed to be **spread** into `CommonUtils.buildModelStrict`.

**Why this return type?** Returning only the three base fields — not the full `MODEL` — is intentional. When spread into `buildModelStrict`, TypeScript still requires you to supply every remaining domain field. If you add a field to your model and forget to map it, TypeScript will error at compile time.

```typescript
public mongoToModel(mongo: UserMongo): UserModel {
    return CommonUtils.buildModelStrict(UserModel, {
        ...this.mongoToModelBase(mongo),  // satisfies id, createdAt, updatedAt
        name: mongo.name,                 // you must provide all remaining fields
    });
}
```

#### `protected buildMongoPayload<D extends MongoCreate<MONGO>>(data: D): MongoCreate<MONGO>`
Builds a typed Mongoose **create** payload. Wraps `CommonUtils.buildModelPartial` with the correct cast, so your mapper code stays cast-free. Base fields (`id`, `_id`, `createdAt`, `updatedAt`) are forbidden at compile time via `MongoCreate<MONGO>`.

```typescript
public buildMongoCreate(model: UserModel): MongoCreate<UserMongo> {
    return this.buildMongoPayload({
        name: this.getModelValue(model, 'name'),
        role: this.getModelValue(model, 'role'),  // falls back to @Default value
    });
}
```

#### `protected buildMongoUpdatePayload<D extends MongoUpdate<MONGO>>(data: D): MongoUpdate<MONGO>`
Builds a typed Mongoose **update** payload. Same cast encapsulation as `buildMongoPayload`, but for partial updates. Use `getModelValue(model, 'field', true)` (patch mode) to leave undefined fields out of the payload.

```typescript
public buildMongoUpdate(model: UserModel): MongoUpdate<UserMongo> {
    return this.buildMongoUpdatePayload({
        name: this.getModelValue(model, 'name', true),  // undefined → field omitted
    });
}
```

#### `public getModelValue<PROPERTY>(model: MODEL, property: PROPERTY, patch?: boolean): MODEL[PROPERTY] | undefined`
Gets a property value from the model with schema-default fallback.

- `patch = false` (default — POST/create): returns the value, or the `@Default()` from the JSON Schema if the value is `undefined`
- `patch = true` (PATCH/update): returns the value if set; returns `undefined` if not set — **does NOT fall back to the schema default**

```typescript
// POST — use schema default when field is undefined
name: this.getModelValue(model, 'name')

// PATCH — omit from payload when field is undefined
name: this.getModelValue(model, 'name', true)
```

#### `protected getIdFromPotentiallyPopulated<T extends BaseMongo>(value: Ref<T>): string`
Extracts the ID string from a Mongoose reference regardless of whether it is populated (full document) or unpopulated (raw ObjectId).

```typescript
child_id: this.getIdFromPotentiallyPopulated(mongo.child_id)
```

#### `protected getPopulated<T>(value: Ref<T>): T`
Returns the populated document from a Mongoose reference. Assumes the reference is populated — use `canBePopulated()` first.

#### `protected canBePopulated<T>(value: Ref<T>): boolean`
Returns `true` if the Mongoose reference is a populated document; `false` if it is a raw ObjectId.

```typescript
if (this.canBePopulated(mongo.author)) {
    const author = this.getPopulated(mongo.author);
    model.authorName = author.name;
} else {
    model.authorId = this.getIdFromPotentiallyPopulated(mongo.author);
}
```

---

### MongoRepository<MONGO>

Abstract base repository for raw database operations. Owns all direct Mongoose queries. Subclasses inject the Mongoose model, declare the document type via `protected mongo`, and implement only the queries their domain needs.

**All queries should use `.lean()` for performance.** Results are deserialized using the built-in helpers.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class

**Abstract Properties (must declare):**

#### `protected model: MongooseModel<MONGO>`
The Mongoose model for database operations. Inject using `@Inject(YourMongoClass)`.

```typescript
@Inject(UserMongo)
protected model!: MongooseModel<UserMongo>;
```

#### `protected mongo: Type<MONGO>`
The class constructor of your Mongoose document type. Used by `deserialize()` to reconstruct typed instances. (Previously named `type` — renamed to `mongo` for consistency with `MongoMapper`.)

```typescript
protected mongo = UserMongo;
```

**Helper Methods:**

#### `protected deserialize(data: MONGO | null): MONGO | null`
Deserializes a lean/plain query result into a typed `MONGO` instance using Ts.ED. Returns `null` when input is `null`.

#### `protected deserializeArray(data: MONGO[]): MONGO[]`
Deserializes an array of lean/plain query results into typed `MONGO` instances.

#### `protected convertHydratedDocumentToObject(document: HydratedDocument<MONGO>): MONGO`
Converts a Mongoose `HydratedDocument` (returned by `model.create()`) to a plain object. Use this when `.lean()` is not available.

---

### Type Utilities

#### `MongoCreate<T>`
Strictly-typed payload for creating a new Mongoose document. Makes fields from `T` optional and uses `never` to **strictly forbid** `id`, `_id`, `createdAt`, and `updatedAt` — TypeScript rejects assignments even from intermediary variables carrying these keys.

**Usage:**
```typescript
type UserCreate = MongoCreate<UserMongo>;
// Result: Partial<{ name: string, email: string, role: string }>
// Strictly forbids: id, _id, createdAt, updatedAt
```

#### `MongoUpdate<T>`
Strictly-typed payload for updating an existing Mongoose document. All fields optional for partial updates. Uses `never` to **strictly forbid** `id`, `_id`, `createdAt`, and `updatedAt`.

**Usage:**
```typescript
type UserUpdate = MongoUpdate<UserMongo>;
// Result: Partial<{ name: string, email: string, role: string }>
// Strictly forbids: id, _id, createdAt, updatedAt
```

#### `MongoFilter<T>`
Filter type for `MongoRepository` queries. Drop-in replacement for Mongoose's `QueryFilter<T>` that works correctly with `BaseMongo._id: string`.

**Usage:**
```typescript
async findByRole(role: string): Promise<UserMongo[]> {
    const results = await this.model.find({ role } satisfies MongoFilter<UserMongo>).lean<UserMongo[]>();
    return this.deserializeArray(results);
}
```

#### `MongoDeleteResult`
Typed result from MongoDB delete operations.

**Properties:**
- `deleted: boolean` - Whether at least one document was deleted
- `deletedCount: number` - Total number of documents removed

#### `MongoUpdateResult`
Typed result from count-based MongoDB update operations.

**Properties:**
- `matched: number` - Number of documents that matched the filter
- `modified: number` - Number of documents actually modified
- `upserted: boolean` - Whether a new document was inserted (upsert)
- `upsertedId: string | null` - The `_id` of the upserted document, or `null`

#### `MongoConfigSchema` / `MongoConfig`
Zod schema and TypeScript type for MongoDB connection configuration. Use with `@radoslavirha/tsed-configuration` when adding MongoDB support.

```typescript
import { MongoConfigSchema, MongoConfig } from '@radoslavirha/tsed-mongoose';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
    config: z.object({ mongodb: MongoConfigSchema })
});
export type AppConfig = z.infer<typeof AppConfigSchema>;
```

## Advanced Patterns

### Handling Mongoose Population

When working with referenced documents, you may need to handle both populated and non-populated references:

```typescript
import { Ref } from '@tsed/mongoose';

@Model({ collection: 'posts', timestamps: true })
export class PostMongo extends BaseMongo {
    @Property()
    public title: string;

    @Ref(() => UserMongo)
    public author: Ref<UserMongo>; // Can be ObjectId or populated UserMongo
}

export class PostModel extends BaseModel {
    @Property()
    public title: string;

    @Property()
    public authorId?: string;

    @Property()
    public authorName?: string;

    @Property()
    public authorEmail?: string;
}

@Injectable()
export class PostMapper extends MongoMapper<PostMongo, PostModel> {
    protected mongo = PostMongo;
    protected model = PostModel;

    public mongoToModel(mongo: PostMongo): PostModel {
        return CommonUtils.buildModelStrict(PostModel, {
            ...this.mongoToModelBase(mongo),
            title: mongo.title,
            // Handle potentially populated reference
            authorId: this.canBePopulated(mongo.author)
                ? this.getPopulated(mongo.author)._id
                : this.getIdFromPotentiallyPopulated(mongo.author),
            authorName: this.canBePopulated(mongo.author)
                ? this.getPopulated(mongo.author).name
                : undefined,
        });
    }

    public buildMongoCreate(model: PostModel): MongoCreate<PostMongo> {
        return this.buildMongoPayload({
            title: this.getModelValue(model, 'title'),
            author: this.getModelValue(model, 'authorId') as unknown as PostMongo['author'],
        });
    }

    public buildMongoUpdate(model: PostModel): MongoUpdate<PostMongo> {
        return this.buildMongoUpdatePayload({
            title: this.getModelValue(model, 'title', true),
        });
    }
}
```

### Using Schema Defaults

`getModelValue` automatically falls back to the `@Default()` schema decorator value when the field is `undefined`. Use `patch=true` in PATCH endpoints to leave fields out when the caller omits them:

```typescript
@Injectable()
export class UserMapper extends MongoMapper<UserMongo, UserModel> {
    protected mongo = UserMongo;
    protected model = UserModel;

    public buildMongoCreate(model: UserModel): MongoCreate<UserMongo> {
        return this.buildMongoPayload({
            name: this.getModelValue(model, 'name'),          // required — no default
            role: this.getModelValue(model, 'role'),          // @Default('user') applies if undefined
            status: this.getModelValue(model, 'status'),      // @Default('active') applies if undefined
        });
    }

    public buildMongoUpdate(model: UserModel): MongoUpdate<UserMongo> {
        return this.buildMongoUpdatePayload({
            name: this.getModelValue(model, 'name', true),    // undefined → omitted from $set
            role: this.getModelValue(model, 'role', true),    // undefined → omitted from $set
        });
    }
}
```

### Complex Query Operations

Split custom query logic between the repository (raw DB queries) and the service (business logic + mapping):

```typescript
// Repository handles all direct Mongoose queries
@Injectable()
export class UserRepository extends MongoRepository<UserMongo> {
    @Inject(UserMongo)
    protected model!: MongooseModel<UserMongo>;

    protected mongo = UserMongo;

    async findByRolePaginated(role: string, skip: number, limit: number): Promise<UserMongo[]> {
        const results = await this.model
            .find({ role } satisfies MongoFilter<UserMongo>)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean<UserMongo[]>();
        return this.deserializeArray(results);
    }

    async countByRole(role: string): Promise<number> {
        return this.model.countDocuments({ role });
    }
}

// Service applies business logic and mapping — no base class
@Injectable()
export class UserService {
    @Inject(UserRepository)
    private repository!: UserRepository;

    @Inject(UserMapper)
    private mapper!: UserMapper;

    async findByRolePaginated(role: string, page: number = 1, limit: number = 10): Promise<UserModel[]> {
        const mongos = await this.repository.findByRolePaginated(role, (page - 1) * limit, limit);
        return mongos.map(m => this.mapper.mongoToModel(m));
    }

    async countByRole(role: string): Promise<number> {
        return this.repository.countByRole(role);
    }
}
```

### Transaction Support

Handle MongoDB transactions by passing a session through the repository:

```typescript
import { ClientSession } from 'mongoose';
import { Inject, Injectable } from '@tsed/di';
import type { MongooseModel } from '@tsed/mongoose';
import { MongoRepository, MongoCreate } from '@radoslavirha/tsed-mongoose';

@Injectable()
export class OrderRepository extends MongoRepository<OrderMongo> {
    @Inject(OrderMongo)
    protected model!: MongooseModel<OrderMongo>;

    protected mongo = OrderMongo;

    async createWithSession(data: MongoCreate<OrderMongo>, session: ClientSession): Promise<OrderMongo> {
        const [doc] = await this.model.create([data], { session });
        return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
    }
}

@Injectable()
export class OrderService {
    @Inject(OrderRepository)
    private repository!: OrderRepository;

    @Inject(OrderMapper)
    private mapper!: OrderMapper;

    async createWithTransaction(order: OrderModel): Promise<OrderModel> {
        const session: ClientSession = await (this.repository as unknown as { model: { db: { startSession(): Promise<ClientSession> } } }).model.db.startSession();

        try {
            session.startTransaction();

            const payload = this.mapper.buildMongoCreate(order);
            const orderMongo = await this.repository.createWithSession(payload, session);

            await session.commitTransaction();

            return this.mapper.mongoToModel(orderMongo);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
```

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- **[@radoslavirha/tsed-common](../common/)** - Base API models (BaseModel) and common utilities
- **[@radoslavirha/utils](../../packages/utils/)** - Utility functions (cloning, validation, etc.)
- **[@radoslavirha/types](../../packages/types/)** - TypeScript utility types
