---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper.getModelValue` now resolves a field's `@Default` from the mapper's declared `model` class, so it no longer throws a `TypeError` when given a plain-object model (e.g. a spread copy).
