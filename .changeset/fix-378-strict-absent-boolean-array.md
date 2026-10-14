---
'@radoslavirha/tsed-platform': patch
---

Strict mode no longer turns an absent `boolean[]` query/path/header parameter into `[]`, so `@Required()` is enforced again and optional ones arrive as `undefined`.
