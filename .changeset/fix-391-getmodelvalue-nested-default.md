---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper.getModelValue` now resolves `@Default` on nested-model and model-collection properties by reading the Ts.ED property metadata instead of the rendered JSON schema.
