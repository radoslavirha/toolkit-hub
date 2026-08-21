---
"@radoslavirha/utils": minor
---

Add the type guards the toolkit was missing, so every basic `typeof`/`instanceof` check has a narrowing equivalent:

- `NumberUtils.isNumber` — follows `typeof` semantics, so `NaN` passes
- `NumberUtils.isFiniteNumber` — excludes `NaN`, `Infinity` and `-Infinity`, for values that must survive arithmetic
- `CommonUtils.isFunction` — narrows to a callable
- `ObjectUtils.isDate` — succeeds for Dates created in another realm, where `instanceof Date` fails
- `StringUtils.isNotEmpty` — a string with at least one non-whitespace character, distinct from `isString` (accepts `''`) and `CommonUtils.isEmpty` (also covers arrays and objects)
