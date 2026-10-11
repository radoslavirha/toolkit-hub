---
"@radoslavirha/utils": patch
---

`ObjectUtils.cloneDeep` now copies symbol-keyed own properties of an `Error`, so clones of errors that keep state under Symbol keys keep working.
