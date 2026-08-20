---
name: using-types
description: Use when writing a string-keyed map type, an exhaustive enum-keyed lookup, a type where every property may be undefined, or a nullable property — or when about to import a type helper from lodash. Names the four helpers this package provides so equivalents are not redeclared per file.
---

# Using @radoslavirha/types

Four type helpers. They exist so the same shapes are not redeclared in every package, and so
lodash type imports are unnecessary.

```ts
import type { Dictionary, EnumDictionary, FullPartial, NullableProperty } from '@radoslavirha/types';

// string-keyed map
const byId: Dictionary<number> = { a: 1 };

// every enum member must have an entry — the compiler enforces exhaustiveness
enum Level { Low = 'LOW', High = 'HIGH' }
const labels: EnumDictionary<Level, string> = { [Level.Low]: 'low', [Level.High]: 'high' };

// T | null, stated as intent rather than a bare union
const maybeName: NullableProperty<string> = null;

// every property optional, recursively where nested
const patch: FullPartial<{ a: string; b: number }> = { a: 'x' };
```

## When each applies

- **`Dictionary<T>`** — `{ [index: string]: T }`. Reach for it instead of writing the index
  signature again, and instead of importing lodash's `Dictionary`.
- **`EnumDictionary<TKey, TType>`** — a mapped type over an enum. Its value is
  exhaustiveness: add an enum member and every lookup built with it fails to compile until
  handled. A `Record<string, T>` will not do that for you.
- **`NullableProperty<T>`** — `T | null`. Use it where null is a meaningful value rather than
  an accident, so intent is visible at the call site.
- **`FullPartial<T>`** — everything optional. Suited to patch payloads and partial updates.

These are types only — no runtime code ships. Importing them costs nothing at runtime, so
there is no reason to hand-roll a local equivalent.
