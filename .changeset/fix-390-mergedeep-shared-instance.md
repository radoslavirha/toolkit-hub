---
'@radoslavirha/utils': patch
---

Fix `ObjectUtils.mergeDeep` merging a class instance that appears under two source keys into the first target subtree for both, dropping the second subtree's data.
