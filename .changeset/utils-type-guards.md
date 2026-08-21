---
"@radoslavirha/utils": minor
---

Add the type guards the toolkit was missing, so every basic `typeof`/`instanceof` check has a narrowing equivalent:

- `NumberUtils.isNumber` — follows `typeof` semantics, so `NaN` passes
- `NumberUtils.isFiniteNumber` — excludes `NaN`, `Infinity` and `-Infinity`, for values that must survive arithmetic
- `CommonUtils.isFunction` — narrows to a callable
- `ObjectUtils.isDate` — succeeds for Dates created in another realm, where `instanceof Date` fails
- `StringUtils.isNotEmpty` — a string with at least one non-whitespace character, distinct from `isString` (accepts `''`) and `CommonUtils.isEmpty` (also covers arrays and objects)

Also ships an opt-in ESLint flat config at `@radoslavirha/utils/eslint` that flags hand-rolled equivalents of these guards — raw null and undefined comparisons, `typeof` tests for string, boolean, number and function, `x instanceof Date`, `Array.isArray`, `JSON.parse(JSON.stringify(...))`, and lodash imports. It is exported as a plain flat-config array, so it adds no ESLint dependency, and it lives here rather than in `@radoslavirha/config-eslint` so a rule can never recommend a method the installed version lacks.
