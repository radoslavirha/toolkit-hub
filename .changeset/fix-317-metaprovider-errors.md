---
"@radoslavirha/logger": patch
---

An `Error` returned by `metaProvider` is now logged as `{ name, message, stack }` instead of `{}`, matching per-call `meta`.
