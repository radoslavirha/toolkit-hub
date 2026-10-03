---
"@radoslavirha/utils": patch
---

`ObjectUtils.mergeDeep` no longer mutates class instances nested in `target`; the result now holds independent copies of them.
