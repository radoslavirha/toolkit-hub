---
"@radoslavirha/tsed-logger": patch
---

Request logs no longer include the raw query string in the `url` field, so `requests.query.redactPaths` can't be bypassed.
