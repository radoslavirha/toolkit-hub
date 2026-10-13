---
'@radoslavirha/tsed-platform': major
---

`requestValidation.strict` now defaults to `true`. Requests that Ts.ED silently coerced now return 400: `null` on a non-nullable field, wrong JSON types (e.g. `"42"` or `1` for a boolean/number body field), `?flag=foo`, and `?n=null` on a non-nullable parameter. Mark fields `@Nullable()` where `null` is legitimate, or restore the old behaviour with `requestValidation: { strict: false }`.
