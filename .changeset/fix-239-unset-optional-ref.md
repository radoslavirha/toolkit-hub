---
"@radoslavirha/tsed-mongoose": patch
---

`MongoMapper.getIdFromPotentiallyPopulated` returns `undefined` for an unset optional ref (`null`/`undefined`) instead of the string `"undefined"`/`"null"`.
