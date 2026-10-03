---
"@radoslavirha/logger": patch
---

`Logger` now keeps the name, message and stack of an `Error` passed as metadata (`logger.error('msg', error)` emits `error_name` / `error_message` / `error_stack`; a nested `{ error }` emits `{ name, message, stack }` instead of `{}`).
