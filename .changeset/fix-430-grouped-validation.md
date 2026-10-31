---
"@radoslavirha/tsed-common": patch
---

`JSONSchemaValidator.validate` now validates properties decorated with `@Groups`; previously they were dropped from the schema, so `required` and type checks were skipped and wrong-typed values were coerced.
