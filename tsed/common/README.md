# @radoslavirha/tsed-common

Base models and common utilities for Ts.ED applications. Provides standardized model patterns with automatic timestamp handling and API documentation support.

## Installation

```bash
# Simple repository
pnpm add @radoslavirha/tsed-common

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-common
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `@tsed/schema` - Required for @Property and @Format decorators

**Recommended:**
- `@radoslavirha/utils` - For building model instances with `CommonUtils.buildModel()`

## What's Included

### BaseModel

The foundational model class for all API response models in Ts.ED applications. Provides standard fields that are common across all entities:

- `id` (string) - Unique identifier
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp

All properties are decorated with `@Property` and `@Format` from `@tsed/schema` for automatic OpenAPI documentation generation.

## Usage

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

## When to Use

✅ Use `BaseModel` when:
- Building REST APIs with Ts.ED
- Need standardized response models with timestamps
- Want automatic OpenAPI/Swagger documentation
- Separating API models from database models

❌ Don't use `BaseModel` when:
- Building database schemas directly (use `BaseMongo` from tsed-mongoose instead)
- Creating request DTOs (timestamps not needed for input)
- Working outside Ts.ED framework

## Related Packages

- [@radoslavirha/utils](../../packages/utils/) - Use `CommonUtils.buildModel()` for creating model instances
- [@radoslavirha/tsed-mongoose](../mongoose/) - Mongoose integration with mapping utilities
- [@radoslavirha/tsed-platform](../platform/) - Base server setup
- [@radoslavirha/tsed-swagger](../swagger/) - API documentation
