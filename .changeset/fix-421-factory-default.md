---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper.getModelValue` now calls a factory `@Default(() => value)` and returns its result instead of `{}`.
