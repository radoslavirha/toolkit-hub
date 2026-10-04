---
"@radoslavirha/logger": patch
---

Metadata with `exception: true` no longer silently drops the whole log line; the value is emitted as `meta_exception`.
