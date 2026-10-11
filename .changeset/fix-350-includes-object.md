---
"@radoslavirha/tsed-logger": patch
---

A non-string `includes` query parameter (e.g. `?includes[a]=b`) no longer makes request logging throw an unhandled rejection that crashed the process.
