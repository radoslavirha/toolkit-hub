---
"@radoslavirha/tsed-common": minor
---

Add `@ArrayOf`, `@MapOf` and `@EnumMapOf` collection decorators with an explicit collection type, nullable collections and values, Mongo-safe keys and enum maps (`@EnumMapOf` generates a named schema with one property per enum value, so OpenAPI lists every key; unknown keys are rejected and every key is required unless `partial`).
