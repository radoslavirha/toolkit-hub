---
'@radoslavirha/utils': minor
---

`ObjectUtils.mergeDeep` is back to a plain-object merge (arrays concatenate). Class instances, `Error`, `Buffer`/typed arrays, cyclic data and root-level arrays are out of scope and get lodash `merge` semantics; objects inside concatenated arrays are shared by reference with the inputs.
