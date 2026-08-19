---
name: using-utils
description: Use before writing a null/undefined/empty check, a `typeof` or `Array.isArray` test, a deep clone, a `new Model()` followed by property assignment, a mapper that has to handle a null input, a distance-between-coordinates calculation, or a lodash import - in any repo that depends on @radoslavirha/utils. Says which guard, which buildModel* variant, and how MappingUtils preserves nullability, so existing utilities are not reimplemented.
---

# Using @radoslavirha/utils

`@radoslavirha/utils` exists so services stop hand-rolling guards, model construction and
mapping. Before writing a raw `=== null`, `typeof x === 'string'`, `Array.isArray(...)` or
a lodash import, check whether one of these covers it.

```ts
import { ArrayUtils, BooleanUtils, CommonUtils, DefaultsUtil, GeoUtils, MappingUtils, NumberUtils, ObjectUtils, StringUtils } from '@radoslavirha/utils';
```

All classes expose **static** methods, with one exception: `MappingUtils` methods are
**instance** methods — you must construct it (`new MappingUtils()`), or inject it where DI
is available.

## Guards - stop writing raw checks

| Instead of | Use | Narrows to |
|---|---|---|
| `x === null` / `x !== null` | `CommonUtils.isNull(x)` / `CommonUtils.notNull(x)` | `Extract<T, null>` / `Exclude<T, null>` |
| `x === undefined` / `x !== undefined` | `CommonUtils.isUndefined(x)` / `CommonUtils.notUndefined(x)` | `Extract<T, undefined>` / `Exclude<T, undefined>` |
| `x == null` / `x != null` | `CommonUtils.isNil(x)` / `CommonUtils.notNil(x)` | `Extract<T, null \| undefined>` / `NonNullable<T>` |
| `typeof x === 'string'` | `StringUtils.isString(x)` | `Extract<T, string>` |
| `typeof x === 'boolean'` | `BooleanUtils.isBoolean(x)` | `Extract<T, boolean>` |
| `Array.isArray(x)` | `ArrayUtils.isArray(x)` | `T & unknown[]` |
| `typeof x === 'object' && x !== null` | `ObjectUtils.isObject(x)` / `ObjectUtils.isPlainObject(x)` | `Extract<T, object>` / `Extract<T, Record<string, unknown>>` |
| `JSON.parse(JSON.stringify(x))` | `ObjectUtils.cloneDeep(x)` | — |
| `x?.enabled === true` on a config object | `ObjectUtils.isEnabled(x)` | `Enabled<T>` (`enabled: true`) |

These are type predicates, so the narrowing survives into the branch:

```ts
import { CommonUtils, StringUtils } from '@radoslavirha/utils';

function handle(token: string | null | undefined): string {
    if (CommonUtils.isNil(token)) {
        return 'anonymous';
    }
    // token: string
    return StringUtils.isString(token) ? token.trim() : 'anonymous';
}
```

`CommonUtils.isEmpty(value)` is separate from the nil guards — it is lodash `isEmpty`
semantics (empty string, empty array, empty object, and also `null`/`undefined`), so it
answers "is there anything here", not "is this null".

## Building model instances

Four variants. Picking the wrong one is the most common mistake, so match the situation:

| Situation | Use |
|---|---|
| Every TypeScript-required property is available | `CommonUtils.buildModelStrict(Type, data)` |
| Only a subset is available, and omitted fields have class-body defaults | `CommonUtils.buildModelPartial(Type, data)` |
| Building the pre-persistence payload (`id`/`_id`/`createdAt`/`updatedAt` not known yet) | `CommonUtils.buildModelCore(Type, data)` |
| — | ~~`CommonUtils.buildModel`~~ is **deprecated**; it takes `Partial<T>` and returns `T`, so it lies about completeness |

```ts
import { CommonUtils } from '@radoslavirha/utils';

class Model {
    id!: string;
    createdAt!: Date;
    updatedAt!: Date;
    name!: string;
    description: string = 'none';
}

// All required properties supplied - fully typed Model
const full = CommonUtils.buildModelStrict(Model, {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'thing',
    description: 'text'
});

// Pre-persistence payload: id / createdAt / updatedAt are rejected by the type
const core = CommonUtils.buildModelCore(Model, { name: 'thing', description: 'text' });

// Subset: provided keys keep their type, omitted ones become T[K] | undefined
const partial = CommonUtils.buildModelPartial(Model, { name: 'thing' });
```

`buildModelPartial` runs the constructor first and then overlays the provided keys, so
class-body defaults (`description: string = 'none'`) survive. Only omit properties that
*have* such a default — omitting a bare `x!: T` yields `undefined` at runtime despite the
type saying otherwise. `buildModelCore` delegates to `buildModelPartial`, so it behaves the
same way.

## Mapping between types

`MappingUtils` preserves nullability through the mapping: `T` maps to `TOut`,
`T | null` maps to `TOut | null`, `T | undefined` maps to `TOut | undefined`. Do not
hand-write `if (x === null) return null;` around a mapper.

```ts
import { MappingUtils } from '@radoslavirha/utils';

class Model { name!: string }
class DTO { label!: string }

const mapping = new MappingUtils();
const toDTO = async (model: Model): Promise<DTO> => ({ label: model.name });

async function example(model: Model | null): Promise<DTO | null> {
    // returns DTO | null - the null case is handled by mapOptionalModel
    return await mapping.mapOptionalModel(model, toDTO);
}
```

Available: `mapOptionalModel`, `mapArray`, `mapOptionalArray`, `mapMap`, `mapOptionalMap`
(all `async`), plus `mapEnum` and `mapOptionalEnum` (sync).

## The rest

- `ArrayUtils.toArray(value)` — normalise `T | T[] | null | undefined` to `T[]`.
- `ObjectUtils.keys` / `values` — null-safe, typed for both objects and `Dictionary<T>`.
- `ObjectUtils.mergeDeep(target, source)` — returns `T & S`.
- `NumberUtils` — `round`, `floor`, `ceil` (with precision), `mean`, `min`, `max`,
  `getPercentFromValue`, `getValueFromPercent`.
- `DefaultsUtil.string(value, fallback)` / `DefaultsUtil.number(value, fallback)` —
  fallback when the value is `null`/`undefined`.
- `GeoUtils.calculateKmBetweenCoordinates(lat1, lon1, lat2, lon2)`, `GeoUtils.degToRad(deg)`
  — do not reimplement haversine.

## Do not reimplement

Lint can catch the syntactic misses; these are the ones it cannot. If you are about to write
any of them by hand, the package already has it:

| About to write | Already exists |
|---|---|
| A haversine / great-circle distance function | `GeoUtils.calculateKmBetweenCoordinates` |
| `deg * (Math.PI / 180)` | `GeoUtils.degToRad` |
| `JSON.parse(JSON.stringify(obj))`, or a recursive clone | `ObjectUtils.cloneDeep` |
| A recursive object merge | `ObjectUtils.mergeDeep` |
| `Math.round(v * 10 ** p) / 10 ** p` | `NumberUtils.round` (also `floor`, `ceil`) |
| `values.reduce((a, b) => a + b, 0) / values.length` | `NumberUtils.mean` |
| `(value / maxValue) * 100` or its inverse | `NumberUtils.getPercentFromValue` / `getValueFromPercent` |
| `Array.isArray(x) ? x : [x]`, with null handling | `ArrayUtils.toArray` |
| `value ?? fallback` where `value` is a possibly-null string or number from config | `DefaultsUtil.string` / `DefaultsUtil.number` |
| A null check wrapped around a mapper call | `MappingUtils.mapOptional*` |
| `if (x === null) return null;` before mapping an array | `MappingUtils.mapOptionalArray` |

Also do not add `lodash` to a package for functionality listed above - `@radoslavirha/utils`
already wraps it, and the wrapper carries the type predicates.
