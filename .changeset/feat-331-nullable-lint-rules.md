---
"@radoslavirha/config-eslint": minor
---

Add opt-in `@radoslavirha/config-eslint/nullable` rules that catch Ts.ED null-modelling traps: bare `@Property()` or one-argument `@CollectionOf` on `X | null`, `@Allow(null)`, `@Nullable(Array)`, and (via `storageDtoRules`) `@Nullable` on scalars in storage DTOs.
