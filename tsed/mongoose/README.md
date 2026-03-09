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
// 1. Mongoose Schema
@Model() class EntityMongo extends BaseMongo { @Property() name: string; }

// 2. API Model  
class Entity extends BaseModel { @Property() name: string; }

// 3. Mapper
@Injectable() class EntityMapper extends MongoMapper<EntityMongo, Entity> {
  async mongoToModel(mongo: EntityMongo): Promise<Entity> {
    const model = new Entity();
    this.mongoToModelBase(model, mongo);
    model.name = mongo.name;
    return model;
  }
  async modelToMongoCreateObject(model: Entity): Promise<MongoCreate<EntityMongo>> {
    return { name: model.name };
  }
  async modelToMongoUpdateObject(model: Entity): Promise<MongoUpdate<EntityMongo>> {
    return { name: model.name };
  }
}

// 4. Repository
@Injectable() class EntityRepository extends MongoRepository<EntityMongo> {
  @Inject(EntityMongo) protected model!: MongooseModel<EntityMongo>;
  protected type = EntityMongo;
}

// 5. Service
@Injectable() class EntityService extends MongoService<EntityMongo, Entity> {
  @Inject(EntityRepository) protected repository!: EntityRepository;
  @Inject() protected mapper!: EntityMapper;
}

// 5. Controller
@Controller('/entities') class EntityController {
  constructor(private service: EntityService) {}
  @Get('/') getAll() { return this.service.find(); }
  @Post('/') create(@BodyParams() data) { return this.service.create(data); }
}
```

**Key Classes:**
- `BaseMongo` - Base schema (_id, createdAt, updatedAt)
- `MongoMapper<MONGO, MODEL>` - Abstract bidirectional mapper
- `MongoRepository<MONGO>` - Abstract repository for DB operations
- `MongoService<MONGO, MODEL>` - Abstract service with CRUD + mapping

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
- **`MongoMapper<MONGO, MODEL>`** - Abstract mapper for bidirectional conversions
- **`MongoRepository<MONGO>`** - Abstract base repository for DB operations
- **`MongoService<MONGO, MODEL>`** - Abstract service with mapping helpers

### Type Utilities

- **`MongoCreate<T>`** - Strictly-typed create payload (strictly forbids `_id`, `createdAt`, `updatedAt`)
- **`MongoUpdate<T>`** - Strictly-typed update payload (strictly forbids `_id`, `createdAt`, `updatedAt`)
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
- **Inbound:** Database → Mongoose Document → Mapper → API Model → Controller → Response
- **Outbound:** Request → Controller → API Model → Mapper → Plain Object → Mongoose → Database

**Benefits:**
- ✅ **Separation of Concerns:** API models are independent from database schemas
- ✅ **Type Safety:** Compile-time type checking for all transformations
- ✅ **Reusability:** Abstract base classes eliminate boilerplate
- ✅ **Testability:** Easy to mock mappers and services
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

Create a mapper to handle bidirectional conversion between Mongoose documents and API models. The mapper must implement three methods: one for reading data and two for writing data.

```typescript
import { Injectable } from '@tsed/di';
import { MongoMapper, MongoCreate, MongoUpdate } from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';

@Injectable()
export class UserMapper extends MongoMapper<UserMongo, UserModel> {
    /**
     * Convert Mongoose document to API model (for reads)
     */
    public async mongoToModel(mongo: UserMongo): Promise<UserModel> {
        const model = new UserModel();
        
        // Map base fields (id, createdAt, updatedAt)
        this.mongoToModelBase(model, mongo);
        
        // Map custom fields
        model.name = mongo.name;
        model.email = mongo.email;
        model.role = mongo.role;
        
        return model;
    }

    /**
     * Convert API model to plain object for creation (for inserts)
     * Omits _id, createdAt, updatedAt (auto-managed by MongoDB)
     */
    public async modelToMongoCreateObject(model: UserModel): Promise<MongoCreate<UserMongo>> {
        return {
            name: model.name,
            email: model.email,
            role: model.role,
        };
    }

    /**
     * Convert API model to plain object for updates (for updates)
     * Omits _id, createdAt (immutable), allows updatedAt auto-update
     */
    public async modelToMongoUpdateObject(model: UserModel): Promise<MongoUpdate<UserMongo>> {
        return {
            name: model.name,
            email: model.email,
            role: model.role,
        };
    }
}
```

**Key Points:**
- Use `@Injectable()` for dependency injection
- Always call `mongoToModelBase()` to map standard fields
- Return type-safe plain objects for create/update operations
- Create and update objects automatically exclude system-managed fields

### 4. Implement Repository (Data Access Layer)

Create a repository that owns all direct Mongoose queries. The repository must inject the Mongoose model, declare the document type, and expose only the data-access methods your domain needs. Use `.lean()` for performance and call the built-in `deserialize()`/`deserializeArray()` helpers to get typed class instances back.

```typescript
import { Injectable, Inject } from '@tsed/di';
import type { MongooseModel } from '@tsed/mongoose';
import { Type } from '@tsed/core';
import { MongoRepository, MongoCreate, MongoUpdate, MongoFilter, MongoDeleteResult } from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';

@Injectable()
export class UserRepository extends MongoRepository<UserMongo> {
    @Inject(UserMongo)
    protected model!: MongooseModel<UserMongo>;

    protected type: Type<UserMongo> = UserMongo;

    async findById(id: string): Promise<UserMongo | null> {
        const result = await this.model.findById(id).lean<UserMongo>();
        return this.deserialize(result);
    }

    async findAll(): Promise<UserMongo[]> {
        const results = await this.model.find().lean<UserMongo[]>();
        return this.deserializeArray(results);
    }

    async create(data: MongoCreate<UserMongo>): Promise<UserMongo> {
        const doc = await this.model.create(data);
        return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
    }

    async updateById(id: string, data: MongoUpdate<UserMongo>): Promise<UserMongo | null> {
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
- Inject the Mongoose model with `@Inject(UserMongo)` and declare `protected type`
- Use `.lean()` on all read queries for performance — results are plain objects
- Call `deserialize()` / `deserializeArray()` to reconstruct typed class instances
- Call `convertHydratedDocumentToObject()` after `model.create()` (which doesn't support `.lean()`)
- Business logic does NOT belong here — keep queries data-access only

### 5. Implement Service (Business Logic Layer)

Create a service that implements your business logic using the repository (for DB access) and the mapper (for transformations). The service provides helper methods for common operations.

```typescript
import { Injectable, Inject } from '@tsed/di';
import { MongoService, MongoDeleteResult } from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';
import { UserMapper } from './UserMapper';
import { UserRepository } from './UserRepository';

@Injectable()
export class UserService extends MongoService<UserMongo, UserModel> {
    @Inject(UserRepository)
    protected repository: UserRepository;

    @Inject()
    protected mapper: UserMapper;

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<UserModel | null> {
        const mongo = await this.repository.findById(id);
        return this.mapSingle(mongo); // Handles null gracefully
    }

    /**
     * Find all users
     */
    async findAll(): Promise<UserModel[]> {
        const mongos = await this.repository.findAll();
        return this.mapMany(mongos); // Maps array in parallel
    }

    /**
     * Create new user
     */
    async create(model: UserModel): Promise<UserModel> {
        const createObject = await this.getCreateObject(model);
        const mongo = await this.repository.create(createObject);
        return this.mapper.mongoToModel(mongo);
    }

    /**
     * Update existing user
     */
    async update(id: string, model: UserModel): Promise<UserModel | null> {
        const updateObject = await this.getUpdateObject(model);
        const mongo = await this.repository.updateById(id, updateObject);
        return this.mapSingle(mongo);
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<MongoDeleteResult> {
        return this.repository.deleteById(id);
    }
}
```

**Key Points:**
- Use `@Injectable()` and inject dependencies with `@Inject()`
- Inject the repository (for DB) and mapper (for transformations) as protected properties
- Use helper methods: `getCreateObject()`, `getUpdateObject()`, `mapSingle()`, `mapMany()`
- Delegate all Mongoose queries to the repository — never call `this.model` directly in a service

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

Abstract class for bidirectional mapping between Mongoose documents and API models. Must be extended and implement three abstract methods.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class
- `MODEL extends BaseModel` - Your API model class (from @radoslavirha/tsed-common)

**Abstract Methods (must implement):**

#### `mongoToModel(mongo: MONGO): Promise<MODEL>`
Converts a Mongoose document to an API model (used for read operations).

```typescript
public async mongoToModel(mongo: UserMongo): Promise<UserModel> {
    const model = new UserModel();
    this.mongoToModelBase(model, mongo);
    model.name = mongo.name;
    return model;
}
```

#### `modelToMongoCreateObject(model: MODEL): Promise<MongoCreate<MONGO>>`
Converts an API model to a plain object for document creation. The return type strictly forbids `_id`, `createdAt`, and `updatedAt`.

```typescript
public async modelToMongoCreateObject(model: UserModel): Promise<MongoCreate<UserMongo>> {
    return {
        name: model.name,
        email: model.email
    };
}
```

#### `modelToMongoUpdateObject(model: MODEL): Promise<MongoUpdate<MONGO>>`
Converts an API model to a plain object for document updates. The return type strictly forbids `_id` and `createdAt`.

```typescript
public async modelToMongoUpdateObject(model: UserModel): Promise<MongoUpdate<UserMongo>> {
    return {
        name: model.name,
        email: model.email
    };
}
```

**Helper Methods:**

#### `mongoToModelBase(model: Partial<MODEL>, mongo: MONGO): MODEL`
Maps base fields (`id`, `createdAt`, `updatedAt`) from Mongoose document to API model.

**Usage:** Always call this at the start of your `mongoToModel` implementation.

```typescript
public async mongoToModel(mongo: UserMongo): Promise<UserModel> {
    const model = new UserModel();
    this.mongoToModelBase(model, mongo); // Maps id, createdAt, updatedAt
    // ... map your custom fields
    return model;
}
```

#### `getIdFromPotentiallyPopulated<T>(value: Ref<T>): string`
Extracts the ID string from a Mongoose reference, handling both populated documents and ObjectId references.

**Usage:** When you need the ID regardless of whether the reference is populated.

```typescript
// Works with both scenarios:
const orgId = this.getIdFromPotentiallyPopulated(mongo.organization); // string
// If populated: extracts mongo.organization._id
// If not populated: converts mongo.organization (ObjectId) to string
```

#### `getPopulated<T>(value: Ref<T>): T`
Gets the populated document from a Mongoose reference. Assumes the reference is populated.

**Usage:** When you know the reference is populated and need the full document.

```typescript
if (this.canBePopulated(mongo.organization)) {
    const org = this.getPopulated(mongo.organization);
    model.organizationName = org.name;
}
```

#### `canBePopulated<T>(value: Ref<T>): boolean`
Checks whether a Mongoose reference is populated (is a document) or not (is an ObjectId).

**Usage:** Conditionally handle populated vs non-populated references.

```typescript
if (this.canBePopulated(mongo.author)) {
    const author = this.getPopulated(mongo.author);
    model.authorName = author.name;
} else {
    model.authorId = this.getIdFromPotentiallyPopulated(mongo.author);
}
```

#### `getModelValue<PROPERTY>(model: MODEL, property: PROPERTY, patch?: boolean): MODEL[PROPERTY] | undefined`
Gets a property value from the model, with fallback to schema defaults if undefined.

**Usage:** Safely access model properties with default value support.

```typescript
public async modelToMongoCreateObject(model: UserModel): Promise<MongoCreate<UserMongo>> {
    return {
        name: this.getModelValue(model, 'name'), // Falls back to schema default
        role: this.getModelValue(model, 'role') ?? 'user' // Custom fallback
    };
}
```

**Note:** For more advanced default value handling, consider using `DefaultsUtil` from `@radoslavirha/utils` which provides utilities for setting default values on objects with type safety.

---

### MongoRepository<MONGO>

Abstract base repository for raw database operations. Owns all direct Mongoose queries. Subclasses inject the Mongoose model, declare the document type, and implement only the queries their domain needs.

**All queries should use `.lean()` for performance.** Results are deserialized using the built-in helpers.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class

**Abstract Properties (must inject):**

#### `protected model: MongooseModel<MONGO>`
The Mongoose model for database operations. Inject using `@Inject(YourMongoClass)`.

```typescript
@Inject(UserMongo)
protected model!: MongooseModel<UserMongo>;
```

#### `protected type: Type<MONGO>`
The class constructor of your Mongoose document type. Used by `deserialize()` to reconstruct typed instances.

```typescript
protected type: Type<UserMongo> = UserMongo;
```

**Helper Methods:**

#### `protected deserialize(data: MONGO | null): MONGO | null`
Deserializes a lean/plain query result into a typed `MONGO` instance using Ts.ED. Returns `null` when input is `null`.

#### `protected deserializeArray(data: MONGO[]): MONGO[]`
Deserializes an array of lean/plain query results into typed `MONGO` instances.

#### `protected convertHydratedDocumentToObject(document: HydratedDocument<MONGO>): MONGO`
Converts a Mongoose `HydratedDocument` (returned by `model.create()`) to a plain object. Use this when `.lean()` is not available.

---

### MongoService<MONGO, MODEL>

Abstract base class for services providing CRUD operations and mapping helpers. Reduces boilerplate in service implementations.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class
- `MODEL extends BaseModel` - Your API model class

**Abstract Properties (must inject):**

#### `protected repository: MongoRepository<MONGO>`
The repository for database operations. Inject using `@Inject(YourRepository)`.

```typescript
@Inject(UserRepository)
protected repository: UserRepository;
```

#### `protected mapper: MongoMapper<MONGO, MODEL>`
The mapper instance for transformations. Inject using `@Inject()`.

```typescript
@Inject()
protected mapper: UserMapper;
```

**Helper Methods:**

#### `protected getCreateObject(model: MODEL): Promise<MongoCreate<MONGO>>`
Convenience wrapper that calls `mapper.modelToMongoCreateObject(model)`. Returns a strictly-typed create payload.

**Usage:** In service create operations.

```typescript
async create(model: UserModel): Promise<UserModel> {
    const createObj = await this.getCreateObject(model);
    const mongo = await this.repository.create(createObj);
    return this.mapper.mongoToModel(mongo);
}
```

#### `protected getUpdateObject(model: MODEL): Promise<MongoUpdate<MONGO>>`
Convenience wrapper that calls `mapper.modelToMongoUpdateObject(model)`. Returns a strictly-typed update payload.

**Usage:** In service update operations.

```typescript
async update(id: string, model: UserModel): Promise<UserModel | null> {
    const updateObj = await this.getUpdateObject(model);
    const mongo = await this.repository.updateById(id, updateObj);
    return this.mapSingle(mongo);
}
```

#### `protected async mapSingle(mongo: MONGO | null | undefined): Promise<MODEL | null>`
Maps a single Mongoose document to an API model. Returns `null` if input is null/undefined.

**Usage:** When mapping single document results (findById, findOne, findOneAndUpdate).

```typescript
async findById(id: string): Promise<UserModel | null> {
    const mongo = await this.repository.findById(id);
    return this.mapSingle(mongo); // Returns null if not found
}
```

#### `protected async mapMany(mongo: MONGO[]): Promise<MODEL[]>`
Maps an array of Mongoose documents to API models. Processes all documents in parallel for optimal performance.

**Usage:** When mapping arrays of documents (find queries).

```typescript
async findAll(): Promise<UserModel[]> {
    const mongos = await this.repository.findAll();
    return this.mapMany(mongos); // Parallel mapping
}
```

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
    public async mongoToModel(mongo: PostMongo): Promise<PostModel> {
        const model = new PostModel();
        this.mongoToModelBase(model, mongo);
        
        model.title = mongo.title;
        
        // Handle potentially populated reference
        if (this.canBePopulated(mongo.author)) {
            // Reference is populated - full document available
            const author = this.getPopulated(mongo.author);
            model.authorName = author.name;
            model.authorEmail = author.email;
        } else {
            // Reference is not populated - only ID available
            model.authorId = this.getIdFromPotentiallyPopulated(mongo.author);
        }
        
        return model;
    }

    public async modelToMongoCreateObject(model: PostModel): Promise<MongoCreate<PostMongo>> {
        return {
            title: model.title,
            author: model.authorId as any // Store as ObjectId reference
        };
    }

    public async modelToMongoUpdateObject(model: PostModel): Promise<MongoUpdate<PostMongo>> {
        return {
            title: model.title,
            author: model.authorId as any
        };
    }
}
```

### Using Schema Defaults

Leverage Mongoose schema defaults with the `getModelValue` helper or use `DefaultsUtil` from `@radoslavirha/utils`:

```typescript
import { DefaultsUtil } from '@radoslavirha/utils';

@Injectable()
export class UserMapper extends MongoMapper<UserMongo, UserModel> {
    public async modelToMongoCreateObject(model: UserModel): Promise<MongoCreate<UserMongo>> {
        // Option 1: Using getModelValue with custom fallback
        return {
            name: this.getModelValue(model, 'name') ?? 'Anonymous',
            email: this.getModelValue(model, 'email'),
            role: this.getModelValue(model, 'role'), // Falls back to schema default if undefined
            status: 'active' // Fixed default value
        };
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

    protected type: Type<UserMongo> = UserMongo;

    async findByRolePaginated(role: string, skip: number, limit: number): Promise<UserMongo[]> {
        const results = await this.model
            .find({ role } satisfies MongoFilter<UserMongo>)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean<UserMongo[]>();
        return this.deserializeArray(results);
    }

    async findByName(query: string): Promise<UserMongo[]> {
        const results = await this.model
            .find({ name: { $regex: query, $options: 'i' } } satisfies MongoFilter<UserMongo>)
            .lean<UserMongo[]>();
        return this.deserializeArray(results);
    }

    async countByRole(role: string): Promise<number> {
        return this.model.countDocuments({ role });
    }

    async updateManyByRole(role: string, data: MongoUpdate<UserMongo>): Promise<MongoUpdateResult> {
        const result = await this.model.updateMany({ role }, { $set: data });
        return {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount > 0,
            upsertedId: result.upsertedId ? String(result.upsertedId) : null
        };
    }
}

// Service applies business logic and mapping
@Injectable()
export class UserService extends MongoService<UserMongo, UserModel> {
    @Inject(UserRepository)
    protected repository: UserRepository;

    @Inject()
    protected mapper: UserMapper;

    async findByRolePaginated(role: string, page: number = 1, limit: number = 10): Promise<UserModel[]> {
        const mongos = await this.repository.findByRolePaginated(role, (page - 1) * limit, limit);
        return this.mapMany(mongos);
    }

    async searchByName(query: string): Promise<UserModel[]> {
        const mongos = await this.repository.findByName(query);
        return this.mapMany(mongos);
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
import { Type } from '@tsed/core';
import { MongoRepository, MongoCreate, MongoFilter } from '@radoslavirha/tsed-mongoose';

@Injectable()
export class OrderRepository extends MongoRepository<OrderMongo> {
    @Inject(OrderMongo)
    protected model!: MongooseModel<OrderMongo>;

    protected type: Type<OrderMongo> = OrderMongo;

    async createWithSession(data: MongoCreate<OrderMongo>, session: ClientSession): Promise<OrderMongo> {
        const [doc] = await this.model.create([data], { session });
        return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
    }
}

@Injectable()
export class OrderService extends MongoService<OrderMongo, OrderModel> {
    @Inject(OrderRepository)
    protected repository: OrderRepository;

    @Inject()
    protected mapper: OrderMapper;

    async createWithTransaction(order: OrderModel): Promise<OrderModel> {
        const session: ClientSession = await this.repository['model'].db.startSession();

        try {
            session.startTransaction();

            const createObj = await this.getCreateObject(order);
            const orderMongo = await this.repository.createWithSession(createObj, session);

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
