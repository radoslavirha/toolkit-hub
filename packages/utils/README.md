# @radoslavirha/utils

A collection of TypeScript utility functions providing common operations, object manipulation, mapping helpers, number calculations, geographic utilities, and default value handling. Built on lodash with additional specialized functionality.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Common utility functions - ALWAYS use instead of reimplementing.

**Install in pnpm monorepo:**
```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/utils
```

**Essential Usage:**
```typescript
import { CommonUtils, ObjectUtils, MappingUtils, NumberUtils, GeoUtils, DefaultsUtil } from '@radoslavirha/utils';

// CommonUtils - Type checking and model building
CommonUtils.isEmpty(value);              // Empty check (objects, arrays, strings)
CommonUtils.isNil(value);                // null/undefined check (type guard)
CommonUtils.notNil(value);               // non-null/non-undefined (type guard)
CommonUtils.isNull(value);               // null check (type guard)
CommonUtils.notNull(value);              // non-null (type guard)
CommonUtils.isUndefined(value);          // undefined check (type guard)
CommonUtils.notUndefined(value);         // defined check (type guard)
CommonUtils.buildModel(Class, data);     // Type-safe model instantiation

// ObjectUtils - Deep operations
ObjectUtils.keys(obj);                   // Object keys
ObjectUtils.values(obj);                 // Object / enum values
ObjectUtils.cloneDeep(obj);              // Deep clone
ObjectUtils.mergeDeep(target, source);   // Deep merge (arrays concatenate!)

// MappingUtils - Null-safe mapping helpers
const mappingUtils = new MappingUtils();
await mappingUtils.mapOptionalModel(model, asyncMapper);
await mappingUtils.mapArray(items, asyncMapper);
mappingUtils.mapEnum({ SourceEnum }, { TargetEnum }, SourceEnum.A);

// NumberUtils - All number operations
NumberUtils.getPercentFromValue(100, 25);    // 25% (25 is 25% of 100)
NumberUtils.getValueFromPercent(100, 25);    // 25 (25% of 100)
NumberUtils.mean([10, 20, 30]);              // 20 (average)
NumberUtils.round(3.14159, 2);               // 3.14
NumberUtils.floor(3.99, 1);                  // 3.9
NumberUtils.ceil(3.01, 1);                   // 3.1
NumberUtils.min([5, 2, 8, 1, 9]);            // 1
NumberUtils.max([5, 2, 8, 1, 9]);            // 9

// GeoUtils - Geographic calculations
GeoUtils.calculateKmBetweenCoordinates(lat1, lon1, lat2, lon2);  // Distance in km
GeoUtils.degToRad(180);                      // Convert degrees to radians

// DefaultsUtil - Safe default values
DefaultsUtil.string(value, 'default');       // Returns default if value is nil/empty
DefaultsUtil.number(value, 0);               // Returns default if value is nil
```

**Complete Method List (ALL 31 methods):**
- **CommonUtils (8):** isEmpty, isNil, notNil, isNull, notNull, isUndefined, notUndefined, buildModel
- **ObjectUtils (4):** keys, values, cloneDeep, mergeDeep
- **MappingUtils (7):** mapOptionalModel, mapArray, mapOptionalArray, mapMap, mapOptionalMap, mapEnum, mapOptionalEnum
- **NumberUtils (8):** getPercentFromValue, getValueFromPercent, mean, round, floor, ceil, min, max
- **GeoUtils (2):** calculateKmBetweenCoordinates, degToRad
- **DefaultsUtil (2):** string, number

**❌ DON'T reimplement:** Type checks, null checks, deep clone/merge, percentage calculations, rounding, distance calculations, default values  
**✅ DO use:** All 31 provided utilities - they're tested, optimized, and maintain consistency

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add @radoslavirha/utils

# Monorepo - install in specific workspace package
pnpm --filter my-service add @radoslavirha/utils

# Monorepo - install in all workspace packages (if shared)
pnpm -r add @radoslavirha/utils
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Dependencies:**
- `lodash` - Core utility functions
- `@radoslavirha/types` - TypeScript utility types

## What's Included

- **CommonUtils** - General purpose utilities (isEmpty, isNil, type checks)
- **ObjectUtils** - Object keys, deep cloning, and merging with array concatenation
- **MappingUtils** - Null-safe async mapping for models, arrays, maps, and enums
- **NumberUtils** - Percentage calculations, rounding, statistical operations
- **GeoUtils** - Geographic distance calculations (Haversine formula)
- **DefaultsUtil** - Safe default value handling for strings and numbers

## Usage

### CommonUtils

General purpose utility functions for common operations.

```typescript
import { CommonUtils } from '@radoslavirha/utils';

// Empty checks
CommonUtils.isEmpty([]);           // true
CommonUtils.isEmpty({ key: 'value' }); // false

// Null/undefined checks (type guards)
CommonUtils.isNil(null);           // true
CommonUtils.isNil(undefined);      // true
CommonUtils.notNil('value');       // true (type guard)

CommonUtils.isNull(null);          // true
CommonUtils.notNull('value');      // true (type guard)

CommonUtils.isUndefined(undefined); // true
CommonUtils.notUndefined('value');  // true (type guard)

// Type-safe model instantiation
class User {
  name!: string;
  email!: string;
}
const user = CommonUtils.buildModel(User, { name: 'John', email: 'john@example.com' });
// Returns a User instance with proper prototype chain
```

**API:**
- `isEmpty<T>(value: T): boolean` - Checks if value is empty (objects, arrays, strings, etc.)
- `isNil<T>(value: T): value is Extract<T, null | undefined>` - Type guard for null or undefined
- `notNil<T>(value: T): value is NonNullable<T>` - Type guard for non-null/non-undefined values
- `isNull<T>(value: T): value is Extract<T, null>` - Type guard for null
- `notNull<T>(value: T): value is Exclude<T, null>` - Type guard for non-null values
- `isUndefined<T>(value: T): value is Extract<T, undefined>` - Type guard for undefined
- `notUndefined<T>(value: T): value is Exclude<T, undefined>` - Type guard for defined values
- `buildModel<T>(type: { new (): T }, data: Partial<T>): T` - Creates type-safe model instances

---

### ObjectUtils

Object manipulation utilities with deep operations.

```typescript
import { ObjectUtils } from '@radoslavirha/utils';

// Object values
const config = { host: 'localhost', port: 3000 };
ObjectUtils.values(config); // ['localhost', 3000] as (string | number)[]

// Enum values (string enum)
enum Direction { Up = 'UP', Down = 'DOWN' }
ObjectUtils.values(Direction); // ['UP', 'DOWN']

// Dictionary values
const dict: Record<string, number> = { a: 1, b: 2 };
ObjectUtils.values(dict); // [1, 2] as number[]

// Deep clone
const original = { nested: { array: [1, 2, 3] } };
const clone = ObjectUtils.cloneDeep(original);
clone.nested.array.push(4); // original unchanged

// Deep merge with array concatenation
const target = { 
    name: 'App', 
    features: ['auth', 'api'],
    config: { port: 3000 }
};
const source = { 
    features: ['logging'],
    config: { host: 'localhost' }
};
const merged = ObjectUtils.mergeDeep(target, source);
// Result: {
//   name: 'App',
//   features: ['auth', 'api', 'logging'],  // Arrays concatenated!
//   config: { port: 3000, host: 'localhost' }
// }
```

**API:**
- `keys<T extends object>(object: T | null | undefined): Array<Extract<keyof T, string>>` - Returns typed object keys
- `keys<T>(object: Dictionary<T> | null | undefined): string[]` - Returns dictionary keys
- `values<T extends object>(object: T | null | undefined): Array<T[keyof T]>` - Returns typed object/enum values
- `values<T>(object: Dictionary<T> | null | undefined): T[]` - Returns dictionary values
- `cloneDeep<T>(object: T): T` - Creates a deep clone
- `mergeDeep<T>(target: T, source: FullPartial<T>): T` - Deep merge with array concatenation

**Note:** Unlike lodash's `merge`, `mergeDeep` concatenates arrays instead of replacing them.

---

### MappingUtils

Null-safe mapping utilities for models, arrays, maps, and enums.

```typescript
import { MappingUtils } from '@radoslavirha/utils';

const mappingUtils = new MappingUtils();

// Model mapping with preserved null/undefined
const dto = await mappingUtils.mapOptionalModel(model, async (item) => ({ id: item.id }));

// Array mapping
const items = await mappingUtils.mapArray([1, 2, 3], async (value) => value * 2); // [2, 4, 6]

// Enum mapping by key name
enum SourceEnum { A = 'A', B = 'B' }
enum TargetEnum { A = 'ONE', B = 'TWO' }
const enumValue = mappingUtils.mapEnum({ SourceEnum }, { TargetEnum }, SourceEnum.A); // 'ONE'
```

**API:**
- `mapOptionalModel<TValue extends object | null | undefined, TOut, TArgs extends unknown[] = []>(model: TValue, mapper: (model: NonNullable<TValue>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut>>`
- `mapArray<TValue extends unknown[] | null, TOut, TArgs extends unknown[] = []>(models: TValue, mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut[]>>`
- `mapOptionalArray<TValue extends unknown[] | null | undefined, TOut, TArgs extends unknown[] = []>(models: TValue, mapper: (model: ArrayElement<NonNullable<TValue>>, ...mapperArgs: TArgs) => Promise<TOut>, ...mapperArgs: TArgs): Promise<Result<TValue, TOut[]>>`
- `mapMap<TValue extends Map<unknown, unknown> | null, TKeyOut, TValueOut>(source: TValue, mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>): Promise<Result<TValue, Map<TKeyOut, TValueOut>>>`
- `mapOptionalMap<TValue extends Map<unknown, unknown> | null | undefined, TKeyOut, TValueOut>(source: TValue, mapper: (key: MapKey<NonNullable<TValue>>, value: MapValue<NonNullable<TValue>>) => Promise<[TKeyOut, TValueOut]>): Promise<Result<TValue, Map<TKeyOut, TValueOut>>>`
- `mapEnum<TSource extends Record<string, string | number>, TTarget extends Record<string, string | number>, TValue extends TSource[keyof TSource] | null>(sourceTypeObject: Record<string, TSource>, targetTypeObject: Record<string, TTarget>, value: TValue, ignoreUnknownKeys?: boolean): Result<TValue, TTarget[keyof TTarget]>`
- `mapOptionalEnum<TSource extends Record<string, string | number>, TTarget extends Record<string, string | number>, TValue extends TSource[keyof TSource] | null | undefined>(sourceTypeObject: Record<string, TSource>, targetTypeObject: Record<string, TTarget>, value: TValue, ignoreUnknownKeys?: boolean): Result<TValue, TTarget[keyof TTarget]>`

---

### NumberUtils

Number operations including percentages, rounding, and statistics.

```typescript
import { NumberUtils } from '@radoslavirha/utils';

// Percentage calculations
NumberUtils.getPercentFromValue(200, 50);  // 25 (50 is 25% of 200)
NumberUtils.getValueFromPercent(200, 25);  // 50 (25% of 200 is 50)

// Statistical operations
NumberUtils.mean([10, 20, 30, 40, 50]);   // 30

// Rounding operations
NumberUtils.round(3.14159, 2);    // 3.14
NumberUtils.floor(3.99, 1);       // 3.9
NumberUtils.ceil(3.01, 1);        // 3.1

// Min/Max
NumberUtils.min([5, 2, 8, 1, 9]); // 1
NumberUtils.max([5, 2, 8, 1, 9]); // 9
```

**API:**
- `getPercentFromValue(maxValue: number, value: number): number` - Calculate percentage
- `getValueFromPercent(maxValue: number, percent: number): number` - Calculate value from percentage
- `mean(values: number[]): number` - Calculate mean/average
- `round(value: number, precision?: number): number` - Round to precision (default: 0)
- `floor(value: number, precision?: number): number` - Floor to precision
- `ceil(value: number, precision?: number): number` - Ceil to precision
- `min(values: number[]): number` - Find minimum value
- `max(values: number[]): number` - Find maximum value

---

### GeoUtils

Geographic calculations using the Haversine formula.

```typescript
import { GeoUtils } from '@radoslavirha/utils';

// Calculate distance between two coordinates
const distance = GeoUtils.calculateKmBetweenCoordinates(
    40.7128, -74.0060,  // New York City
    51.5074, -0.1278    // London
);
console.log(distance); // ~5570.2464 km (rounded to 4 decimal places)

// Convert degrees to radians (utility method)
const radians = GeoUtils.degToRad(180); // 3.14159...
```

**API:**
- `calculateKmBetweenCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number` - Distance in kilometers (rounded to 4 decimals)
- `degToRad(deg: number): number` - Convert degrees to radians

**Use Cases:**
- Distance-based search (find nearby locations)
- Travel distance calculations
- Geofencing logic
- Route optimization

---

### DefaultsUtil

Safe default value handling for optional parameters.

```typescript
import { DefaultsUtil } from '@radoslavirha/utils';

// String defaults
DefaultsUtil.string(null, 'default');      // 'default'
DefaultsUtil.string(undefined, 'default'); // 'default'
DefaultsUtil.string('', 'default');        // 'default' (empty string → default)
DefaultsUtil.string('value', 'default');   // 'value'

// Number defaults
DefaultsUtil.number(null, 42);      // 42
DefaultsUtil.number(undefined, 42); // 42
DefaultsUtil.number(0, 42);         // 0 (zero is valid)
DefaultsUtil.number(100, 42);       // 100

// Practical usage in functions
function greet(name?: string): string {
    const userName = DefaultsUtil.string(name, 'Guest');
    return `Hello, ${userName}!`;
}

function paginate(page?: number, pageSize?: number) {
    const currentPage = DefaultsUtil.number(page, 1);
    const size = DefaultsUtil.number(pageSize, 20);
    return { page: currentPage, size };
}
```

**API:**
- `string(value: string | undefined | null, defaultValue: string): string` - Returns default if value is nil or empty
- `number(value: number | undefined | null, defaultValue: number): number` - Returns default if value is nil

**Note:** For strings, empty string (`''`) is considered "no value" and returns the default. For numbers, `0` is a valid value.

## API Reference

| Utility Class | Methods | Purpose |
|---------------|---------|---------|
| CommonUtils | 8 methods | Type checking, null/undefined guards, emptiness checks, model instantiation |
| ObjectUtils | 3 methods | Typed object keys, deep clone, deep merge with array concatenation |
| MappingUtils | 7 methods | Null-safe mapping for models, arrays, maps, and enums |
| NumberUtils | 8 methods | Percentages, statistics, rounding, min/max |
| GeoUtils | 2 methods | Haversine distance calculations, degree conversion |
| DefaultsUtil | 2 methods | Safe default values for strings/numbers |

**Total: 30 utility methods**

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/types](../types/) - TypeScript utility types used by ObjectUtils and MappingUtils
