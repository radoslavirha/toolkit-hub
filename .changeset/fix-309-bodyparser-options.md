---
"@radoslavirha/tsed-platform": patch
---

`BaseServer` now builds its JSON/URL-encoded body parsers through the platform adapter, so `rawBody: true` populates `req.rawBody`, and a `json-parser`/`urlencoded-parser` configured in `middlewares` (e.g. a larger `limit`) is no longer shadowed.
