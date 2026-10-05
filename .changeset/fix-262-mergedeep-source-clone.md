---
"@radoslavirha/utils": patch
---

`ObjectUtils.mergeDeep` no longer shares array elements or nested values with `source`, so mutating the result cannot mutate the caller's input.
