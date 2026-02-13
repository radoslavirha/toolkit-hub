# @radoslavirha/types

TypeScript utility types for enhanced type safety and reusability. Provides specialized utility types for enum dictionaries and deep partial objects.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** TypeScript utility types for enums and deep partials.

**Install in pnpm monorepo:**
```bash
pnpm --filter YOUR_PACKAGE_NAME add @radoslavirha/types
```

**Essential Usage:**
```typescript
import { EnumDictionary, FullPartial } from '@radoslavirha/types';

// EnumDictionary - Type-safe enum mappings
enum Role { ADMIN = 'ADMIN', USER = 'USER' }

const permissions: EnumDictionary<Role, string[]> = {
  [Role.ADMIN]: ['read', 'write', 'delete'],
  [Role.USER]: ['read']  // TypeScript ensures all enum values are mapped
};

// FullPartial - Deep partial (recursive)
interface Config {
  database: { host: string; port: number; };
  cache: { ttl: number; };
}

const partial: FullPartial<Config> = {
  database: { host: 'localhost' }  // port is optional (deep partial)
};
```

**Key Exports:**
- `EnumDictionary<TKey, TType>` - Type-safe enum-to-value mappings
- `FullPartial<T>` - Recursive partial type

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add @radoslavirha/types

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/types

# Monorepo - install in all workspace packages (if shared)
pnpm -r add @radoslavirha/types
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

## What's Included

- **EnumDictionary<TKey, TType>** - Type-safe enum-to-value mappings
- **FullPartial<T>** - Deep partial type utility (recursive)

## Usage

### EnumDictionary

Creates a type-safe dictionary where keys are constrained to enum values and values are of a specified type. Ensures all enum values are mapped and prevents typos in dictionary keys.

```typescript
import { EnumDictionary } from '@radoslavirha/types';

// Define an enum
enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUEST = 'GUEST'
}

// Create a type-safe dictionary
const rolePermissions: EnumDictionary<UserRole, string[]> = {
    [UserRole.ADMIN]: ['read', 'write', 'delete'],
    [UserRole.USER]: ['read', 'write'],
    [UserRole.GUEST]: ['read'],
};

// TypeScript ensures all roles are defined
// Missing a role? Compile error!
// Typo in role name? Compile error!

// Access values safely
const adminPerms = rolePermissions[UserRole.ADMIN]; // string[]
```

**Complex objects example:**

```typescript
enum Status {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

interface StatusConfig {
    label: string;
    color: string;
    icon: string;
}

const statusConfigs: EnumDictionary<Status, StatusConfig> = {
    [Status.PENDING]: {
        label: 'Pending Review',
        color: 'yellow',
        icon: 'clock'
    },
    [Status.APPROVED]: {
        label: 'Approved',
        color: 'green',
        icon: 'check'
    },
    [Status.REJECTED]: {
        label: 'Rejected',
        color: 'red',
        icon: 'x'
    }
};

function getStatusDisplay(status: Status): string {
    const config = statusConfigs[status];
    return `${config.icon} ${config.label}`;
}
```

### FullPartial

Makes all properties of an object optional recursively, including nested objects. Unlike TypeScript's built-in `Partial<T>`, this utility type applies the partial transformation to all nested levels.

```typescript
import { FullPartial } from '@radoslavirha/types';

// Complex nested type
interface User {
    id: string;
    name: string;
    profile: {
        email: string;
        address: {
            street: string;
            city: string;
            country: string;
        };
        preferences: {
            theme: string;
            notifications: boolean;
        };
    };
}

// Standard Partial - only first level optional
type ShallowPartial = Partial<User>;
// ❌ profile.email is still required if profile exists

// FullPartial - all levels optional
type DeepPartial = FullPartial<User>;
// ✅ Every property at every level is optional

// Practical usage: partial update objects
function updateUser(id: string, updates: FullPartial<User>): void {
    // Can update any nested property without providing the full structure
    const validUpdate: FullPartial<User> = {
        profile: {
            address: {
                city: 'New York' // Only city, no need for street/country
            }
        }
    };
}
```

**Partial update example:**
```typescript
class UserService {
    async update(id: string, updates: FullPartial<User>): Promise<User> {
        // Apply only provided properties at any depth
    }
}
```

---

## API Reference

### EnumDictionary<TKey extends string | number | symbol, TType>

Creates a type where the keys are constrained to the values of an enum and values are of type `TType`.

**Type Parameters:**
- `TKey` - The enum type to use as keys
- `TType` - The type of values in the dictionary

**Example:**
```typescript
enum Status { PENDING = 'PENDING', ACTIVE = 'ACTIVE' }
const config: EnumDictionary<Status, { color: string }> = {
  [Status.PENDING]: { color: 'yellow' },
  [Status.ACTIVE]: { color: 'green' }
};
```

### FullPartial<T>

Recursively makes all properties of type `T` optional, including nested objects.

**Type Parameter:**
- `T` - The type to make fully partial

**Example:**
```typescript
interface User { profile: { email: string; name: string; } }
const update: FullPartial<User> = { profile: { email: 'new@email.com' } }; // name is optional
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/utils](../utils/) - Uses `FullPartial` in `ObjectUtils.mergeDeep`
