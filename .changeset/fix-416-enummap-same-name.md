---
"@radoslavirha/tsed-common": patch
---

`EnumMapOf` / `EnumMapModel` now throw when a `name` is reused with a different value class that has the same class name, instead of silently returning the first generated model.
