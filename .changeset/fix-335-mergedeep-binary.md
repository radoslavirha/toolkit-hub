---
"@radoslavirha/utils": patch
---

`ObjectUtils.mergeDeep` keeps a `Buffer` or typed array a `Buffer` or typed array when target and source both hold one; the source value replaces the target instead of becoming a plain `Array`.
