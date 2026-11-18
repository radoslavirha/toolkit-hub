---
"@radoslavirha/logger": patch
---

Convert an `Error` carried by a nested `Error` (`origin`, `inner`) in meta, so the root cause is no longer logged as `{}`.
