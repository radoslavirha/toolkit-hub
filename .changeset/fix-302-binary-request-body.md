---
"@radoslavirha/tsed-logger": patch
---

Request bodies with a non-text `Content-Type` (e.g. `image/png`) are now logged as `[[ BINARY ]]` instead of being decoded into mojibake.
