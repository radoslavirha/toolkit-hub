---
"@radoslavirha/logger": patch
---

An `Error` created in another realm (`node:vm`, jsdom) passed as meta is now logged with its `error_*` fields instead of none.
