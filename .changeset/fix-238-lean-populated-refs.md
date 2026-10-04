---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper` now recognises refs populated through `.lean()` + `deserialize()`: `canBePopulated` returns `true`, `getPopulated` returns the document instead of throwing, and `getIdFromPotentiallyPopulated` returns the referenced id instead of `"[object Object]"`.
