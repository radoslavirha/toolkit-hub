---
"@radoslavirha/tsed-logger": patch
---

Request failure logs now keep a description of non-`Error` thrown values (strings, plain objects) in `error_message` instead of logging it as `undefined`.
