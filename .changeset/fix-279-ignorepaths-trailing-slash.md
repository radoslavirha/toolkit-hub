---
"@radoslavirha/tsed-logger": patch
---

`requests.ignorePaths` entries written with a trailing slash (e.g. `/metrics/`) now suppress the path and everything beneath it; `/` suppresses all request logging.
