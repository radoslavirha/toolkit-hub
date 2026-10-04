---
"@radoslavirha/utils": patch
---

`ObjectUtils.cloneDeep` now clones `Error` instances (including nested ones) instead of returning `{}` or a shared reference.
