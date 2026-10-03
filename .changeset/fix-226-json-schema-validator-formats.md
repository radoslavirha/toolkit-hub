---
"@radoslavirha/tsed-common": patch
---

`JSONSchemaValidator` now validates `BaseModel` subclasses (and any model using `@Format`) instead of throwing `unknown format "date-time"`: it registers the standard `ajv-formats` formats and validates the raw input before deserializing it, so wrong-typed input is no longer coerced into passing. `BaseModel.createdAt`/`updatedAt` now declare `@Property(Date)`, so the published build emits `{ type: 'string', format: 'date-time' }` for them instead of `{ type: 'object' }`.
