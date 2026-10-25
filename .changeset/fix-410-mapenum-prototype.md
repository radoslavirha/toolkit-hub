---
'@radoslavirha/utils': patch
---

`MappingUtils.mapEnum` no longer returns an `Object.prototype` member when a source enum key such as `toString` is missing in the target enum.
