---
'@radoslavirha/tsed-platform': patch
---

Strict request validation now applies its query rules to fields of a `@QueryParams()` model: `?oBoolean=1|0` binds as a boolean and `?onNumber=null` binds as `null` on nullable fields instead of answering 400.
