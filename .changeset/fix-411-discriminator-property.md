---
"@radoslavirha/tsed-common": patch
---

`JSONSchemaValidator` no longer throws "schema is invalid" for a model with a property named `discriminator`, and no longer mutates the schema Ts.ED caches for the validated model.
