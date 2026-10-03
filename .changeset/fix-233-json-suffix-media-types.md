---
"@radoslavirha/tsed-logger": patch
---

Request logs now include the response body for `+json`/`+xml` media types such as `application/problem+json` and `application/vnd.api+json`, instead of `[[ BINARY ]]`.
