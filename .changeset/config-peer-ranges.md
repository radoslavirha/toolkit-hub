---
"@radoslavirha/config-eslint": patch
"@radoslavirha/config-tsdown": patch
"@radoslavirha/config-typescript": patch
"@radoslavirha/config-vitest": patch
---

Declare peer dependencies as caret ranges (`eslint ^10.14.0`, `vitest ^5.1.0`, `@vitest/coverage-v8 ^5.1.0`, `@swc/core ^1.16.22`, `tsdown ^0.23.7`, `tslib ^2.9.1`, `typescript ^6.0.3`) instead of exact versions, so consumers that bump them no longer get unmet-peer warnings. `config-eslint` also moves to `typescript-eslint` 8.72.1.
