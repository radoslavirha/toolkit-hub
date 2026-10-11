---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper.getModelValue` now returns a fresh copy of an object or array `@Default`, so changing one create payload no longer changes the default for later creates.
