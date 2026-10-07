---
'@radoslavirha/utils': patch
---

Fix `ObjectUtils.cloneDeep` duplicating objects that are shared with, or form a cycle through, an `Error`; aliasing and cycles are now preserved.
