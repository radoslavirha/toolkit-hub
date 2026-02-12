# @radoslavirha/tsed-mongoose

Mongoose integration utilities for Ts.ED applications providing a clean architecture pattern for MongoDB integration. This package enforces separation between database schemas (Mongoose models) and API models through abstract mapper and service base classes. It provides type-safe bidirectional mapping, automatic population handling, and reusable CRUD patterns for building scalable microservices with clean layered architecture.

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
- **`MongoService<MONGO, MODEL>`** - Abstract service with mapping helpers

### Type Utilities

- **`MongoosePlainObject<T>`** - Plain object type for Mongoose documents
- **`MongoosePlainObjectCreate<T>`** - Create type (omits `_id`, timestamps)
- **`MongoosePlainObjectUpdate<T>`** - Update type (omits `_id`, `createdAt`)

## Architecture Pattern

This package enforces a clean architecture pattern with clear separation of concerns:

```
Controller (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Mapper (Transformation Layer)
    ↓
Mongoose Model (Data Layer)
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
import { MongoMapper, MongoosePlainObjectCreate, MongoosePlainObjectUpdate } from '@radoslavirha/tsed-mongoose';
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
    public async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<UserMongo>> {
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
    public async modelToMongoUpdateObject(model: UserModel): Promise<MongoosePlainObjectUpdate<UserMongo>> {
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

### 4. Implement Service (Business Logic Layer)

Create a service that implements your business logic using the mapper and Mongoose model. The service provides helper methods for common operations.

```typescript
import { Injectable, Inject } from '@tsed/di';
import { MongooseModel } from '@tsed/mongoose';
import { MongoService } from '@radoslavirha/tsed-mongoose';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';
import { UserMapper } from './UserMapper';

@Injectable()
export class UserService extends MongoService<UserMongo, UserModel> {
    @Inject(UserMongo)
    protected model: MongooseModel<UserMongo>;

    @Inject()
    protected mapper: UserMapper;

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<UserModel | null> {
        const mongo = await this.model.findById(id).exec();
        return this.mapSingle(mongo); // Handles null gracefully
    }

    /**
     * Find all users
     */
    async findAll(): Promise<UserModel[]> {
        const mongo = await this.model.find().exec();
        return this.mapMany(mongo); // Maps array in parallel
    }

    /**
     * Create new user
     */
    async create(model: UserModel): Promise<UserModel> {
        const createObject = await this.getCreateObject(model);
        const mongo = await this.model.create(createObject);
        return this.mapper.mongoToModel(mongo);
    }

    /**
     * Update existing user
     */
    async update(id: string, model: UserModel): Promise<UserModel | null> {
        const updateObject = await this.getUpdateObject(model);
        const mongo = await this.model.findByIdAndUpdate(id, updateObject, { new: true }).exec();
        return this.mapSingle(mongo);
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }
}
```

**Key Points:**
- Use `@Injectable()` and inject dependencies with `@Inject()`
- Inject both the Mongoose model and mapper as protected properties
- Use helper methods: `getCreateObject()`, `getUpdateObject()`, `mapSingle()`, `mapMany()`
- Always use `.exec()` on Mongoose queries for proper TypeScript typing

### 5. Use in Controller (HTTP Layer)

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

#### `modelToMongoCreateObject(model: MODEL): Promise<MongoosePlainObjectCreate<MONGO>>`
Converts an API model to a plain object for document creation. The return type automatically excludes `_id`, `createdAt`, and `updatedAt`.

```typescript
public async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<UserMongo>> {
    return {
        name: model.name,
        email: model.email
    };
}
```

#### `modelToMongoUpdateObject(model: MODEL): Promise<MongoosePlainObjectUpdate<MONGO>>`
Converts an API model to a plain object for document updates. The return type automatically excludes `_id` and `createdAt`.

```typescript
public async modelToMongoUpdateObject(model: UserModel): Promise<MongoosePlainObjectUpdate<UserMongo>> {
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
public async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<UserMongo>> {
    return {
        name: this.getModelValue(model, 'name'), // Falls back to schema default
        role: this.getModelValue(model, 'role') ?? 'user' // Custom fallback
    };
}
```

**Note:** For more advanced default value handling, consider using `DefaultsUtil` from `@radoslavirha/utils` which provides utilities for setting default values on objects with type safety.

#### `getModelDefault<PROPERTY>(property: PROPERTY): MODEL[PROPERTY] | undefined`
Gets the default value for a property from the Mongoose schema definition.

---

### MongoService<MONGO, MODEL>

Abstract base class for services providing CRUD operations and mapping helpers. Reduces boilerplate in service implementations.

**Type Parameters:**
- `MONGO extends BaseMongo` - Your Mongoose schema class
- `MODEL extends BaseModel` - Your API model class

**Abstract Properties (must inject):**

#### `protected model: MongooseModel<MONGO>`
The Mongoose model for database operations. Inject using `@Inject(YourMongoClass)`.

```typescript
@Inject(UserMongo)
protected model: MongooseModel<UserMongo>;
```

#### `protected mapper: MongoMapper<MONGO, MODEL>`
The mapper instance for transformations. Inject using `@Inject()`.

```typescript
@Inject()
protected mapper: UserMapper;
```

**Helper Methods:**

#### `protected getCreateObject(model: MODEL): Promise<MongoosePlainObjectCreate<MONGO>>`
Converts an API model to a Mongoose create object (omits `_id`, `createdAt`, `updatedAt`).

**Usage:** In service create operations.

```typescript
async create(model: UserModel): Promise<UserModel> {
    const createObj = await this.getCreateObject(model);
    const mongo = await this.model.create(createObj);
    return this.mapper.mongoToModel(mongo);
}
```

#### `protected getUpdateObject(model: MODEL): Promise<MongoosePlainObjectUpdate<MONGO>>`
Converts an API model to a Mongoose update object (omits `_id`, `createdAt`).

**Usage:** In service update operations.

```typescript
async update(id: string, model: UserModel): Promise<UserModel | null> {
    const updateObj = await this.getUpdateObject(model);
    const mongo = await this.model.findByIdAndUpdate(id, updateObj, { new: true });
    return this.mapSingle(mongo);
}
```

#### `protected async mapSingle(mongo: MONGO | null | undefined): Promise<MODEL | null>`
Maps a single Mongoose document to an API model. Returns `null` if input is null/undefined.

**Usage:** When mapping single document results (findById, findOne, findOneAndUpdate).

```typescript
async findById(id: string): Promise<UserModel | null> {
    const mongo = await this.model.findById(id).exec();
    return this.mapSingle(mongo); // Returns null if not found
}
```

#### `protected async mapMany(mongo: MONGO[]): Promise<MODEL[]>`
Maps an array of Mongoose documents to API models. Processes all documents in parallel for optimal performance.

**Usage:** When mapping arrays of documents (find queries).

```typescript
async findAll(): Promise<UserModel[]> {
    const mongos = await this.model.find().exec();
    return this.mapMany(mongos); // Parallel mapping
}
```

---

### Type Utilities

Type utilities for creating type-safe plain objects from Mongoose documents.

#### `MongoosePlainObject<T>`
Converts a Mongoose document type to a plain object type by removing Mongoose methods and getters.

**Usage:**
```typescript
type UserPlain = MongoosePlainObject<UserDocument>;
// Result: { _id: ObjectId, name: string, email: string, ... }
```

#### `MongoosePlainObjectCreate<T>`
Type for document creation. Makes all properties optional (Partial) and excludes auto-managed fields: `id`, `_id`, `createdAt`, `updatedAt`.

**Usage:**
```typescript
type UserCreate = MongoosePlainObjectCreate<UserMongo>;
// Result: Partial<{ name: string, email: string, role: string }>
// Excludes: _id, createdAt, updatedAt
```

#### `MongoosePlainObjectUpdate<T>`
Type for document updates. Makes all properties optional (Partial) and excludes immutable fields: `id`, `_id`, `createdAt`, `updatedAt`.

**Usage:**
```typescript
type UserUpdate = MongoosePlainObjectUpdate<UserMongo>;
// Result: Partial<{ name: string, email: string, role: string }>
// Excludes: _id, createdAt (updatedAt is auto-updated by Mongoose)
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

    public async modelToMongoCreateObject(model: PostModel): Promise<MongoosePlainObjectCreate<PostMongo>> {
        return {
            title: model.title,
            author: model.authorId as any // Store as ObjectId reference
        };
    }

    public async modelToMongoUpdateObject(model: PostModel): Promise<MongoosePlainObjectUpdate<PostMongo>> {
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
    public async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<UserMongo>> {
        // Option 1: Using getModelValue with custom fallback
        return {
            name: this.getModelValue(model, 'name') ?? 'Anonymous',
            email: this.getModelValue(model, 'email'),
            role: this.getModelValue(model, 'role'), // Falls back to schema default if undefined
            status: 'active' // Fixed default value
        };

        // Option 2: Using DefaultsUtil for complex default handling
        return DefaultsUtil.setDefaults({
            name: model.name,
            email: model.email,
            role: model.role,
            status: model.status
        }, {
            name: 'Anonymous',
            role: 'user',
            status: 'active'
        });
    }
}
```

### Complex Query Operations

Extend service with custom query methods:

```typescript
@Injectable()
export class UserService extends MongoService<UserMongo, UserModel> {
    @Inject(UserMongo)
    protected model: MongooseModel<UserMongo>;

    @Inject()
    protected mapper: UserMapper;

    /**
     * Find users by role with pagination
     */
    async findByRole(role: string, page: number = 1, limit: number = 10): Promise<UserModel[]> {
        const mongo = await this.model
            .find({ role })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();
        
        return this.mapMany(mongo);
    }

    /**
     * Search users by name (case-insensitive)
     */
    async searchByName(query: string): Promise<UserModel[]> {
        const mongo = await this.model
            .find({ name: { $regex: query, $options: 'i' } })
            .exec();
        
        return this.mapMany(mongo);
    }

    /**
     * Count users by role
     */
    async countByRole(role: string): Promise<number> {
        return this.model.countDocuments({ role });
    }

    /**
     * Batch update users
     */
    async updateMany(filter: object, updates: Partial<UserModel>): Promise<number> {
        const updateObj = await this.getUpdateObject(updates as UserModel);
        const result = await this.model.updateMany(filter, updateObj);
        return result.modifiedCount;
    }
}
```

### Transaction Support

Handle MongoDB transactions in services:

```typescript
import { ClientSession } from 'mongoose';

@Injectable()
export class OrderService extends MongoService<OrderMongo, OrderModel> {
    @Inject(OrderMongo)
    protected model: MongooseModel<OrderMongo>;

    @Inject()
    protected mapper: OrderMapper;

    @Inject()
    private userService: UserService;

    /**
     * Create order with user balance update in transaction
     */
    async createWithTransaction(order: OrderModel, userId: string): Promise<OrderModel> {
        const session: ClientSession = await this.model.db.startSession();
        
        try {
            session.startTransaction();

            // Create order
            const createObj = await this.getCreateObject(order);
            const [orderMongo] = await this.model.create([createObj], { session });

            // Update user balance
            await this.userService.updateBalance(userId, -order.total, session);

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

## Testing

### Unit Testing Mappers

Test mappers in isolation by mocking Mongoose documents:

```typescript
import { describe, it, expect } from 'vitest';
import { CommonUtils } from '@radoslavirha/utils';
import { UserMapper } from './UserMapper';
import { UserMongo } from './UserMongo';
import { UserModel } from './UserModel';

describe('UserMapper', () => {
    const mapper = new UserMapper();

    describe('mongoToModel', () => {
        it('should map Mongoose document to API model', async () => {
            const mongo = CommonUtils.buildModel(UserMongo, {
                _id: '507f1f77bcf86cd799439011',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'admin',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02')
            });

            const model = await mapper.mongoToModel(mongo);

            expect(model).toBeInstanceOf(UserModel);
            expect(model.id).toBe('507f1f77bcf86cd799439011');
            expect(model.name).toBe('John Doe');
            expect(model.email).toBe('john@example.com');
            expect(model.role).toBe('admin');
            expect(model.createdAt).toStrictEqual(new Date('2024-01-01'));
            expect(model.updatedAt).toStrictEqual(new Date('2024-01-02'));
        });
    });

    describe('modelToMongoCreateObject', () => {
        it('should convert model to create object', async () => {
            const model = CommonUtils.buildModel(UserModel, {
                name: 'Jane Doe',
                email: 'jane@example.com',
                role: 'user'
            });

            const createObj = await mapper.modelToMongoCreateObject(model);

            expect(createObj).toStrictEqual({
                name: 'Jane Doe',
                email: 'jane@example.com',
                role: 'user'
            });
            expect(createObj).not.toHaveProperty('_id');
            expect(createObj).not.toHaveProperty('createdAt');
        });
    });
});
```

### Integration Testing Services

Test services with real MongoDB using Ts.ED TestContainersMongo:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlatformTest } from '@tsed/common';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { CommonUtils } from '@radoslavirha/utils';
import { UserService } from './UserService';
import { UserModel } from './UserModel';

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => TestContainersMongo.create());
    beforeEach(() => {
        userService = PlatformTest.get<UserService>(UserService);
    });
    afterEach(() => TestContainersMongo.reset());

    it('should create and retrieve user', async () => {
        const newUser = CommonUtils.buildModel(UserModel, {
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
        });

        const created = await userService.create(newUser);
        expect(created).toBeInstanceOf(UserModel);
        expect(created.id).toBeDefined();
        expect(created.name).toBe('Test User');

        const found = await userService.findById(created.id);
        expect(found).toBeInstanceOf(UserModel);
        expect(found).toStrictEqual(created);
    });
});
```

## When to Use

✅ **Use this package when:**
- Building Ts.ED APIs with MongoDB/Mongoose
- Need clean separation between database and API layers
- Want type-safe mapping with compile-time checking
- Working with Mongoose population and references
- Building scalable microservices with reusable patterns
- Need protection from accidental modification of system fields

❌ **Don't use when:**
- Using a different database (PostgreSQL, MySQL, etc.) - use appropriate ORM
- Building simple prototypes without layered architecture
- API models exactly match database schemas 1:1 with no transformations
- Not using Ts.ED framework

## Related Packages

- **[@radoslavirha/tsed-common](../common/)** - Base API models (BaseModel) and common utilities
- **[@radoslavirha/utils](../../packages/utils/)** - Utility functions (cloning, validation, etc.)
- **[@radoslavirha/types](../../packages/types/)** - TypeScript utility types

## Contributing

See [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
