---
"@radoslavirha/logger": patch
---

An `Error` held in an own property of an `Error` passed as meta (e.g. `originalError`) is now logged as `{ name, message, stack }` instead of `{}`.
