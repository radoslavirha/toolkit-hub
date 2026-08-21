---
"@radoslavirha/config-eslint": minor
---

Add an opt-in `@radoslavirha/config-eslint/toolkit` config that steers code toward `@radoslavirha/utils`: raw null/undefined comparisons, `typeof` tests for string, boolean, number and function, `x instanceof Date`, `Array.isArray`, `JSON.parse(JSON.stringify(...))`, and lodash imports each warn with the toolkit method that replaces them.

It is a separate export rather than part of the base config because every message names a method the project must be able to import — enabling it where `utils` is not a dependency would only produce noise. All rules are `warn`, and `x == null` is deliberately not flagged.
