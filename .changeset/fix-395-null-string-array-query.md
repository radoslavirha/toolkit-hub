---
'@radoslavirha/tsed-platform': patch
---

Strict request validation no longer answers 400 for `?v=null` on a non-nullable `string[]` query parameter; the text stays text and binds as `['null']`.
