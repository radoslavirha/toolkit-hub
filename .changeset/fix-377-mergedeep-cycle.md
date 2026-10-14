---
"@radoslavirha/utils": patch
---

`ObjectUtils.mergeDeep` no longer overflows the stack when target and source hold self-referencing class instances at the same key.
