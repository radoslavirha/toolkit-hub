---
"@radoslavirha/tsed-common": patch
---

`@ArrayOf(Date)` and `@MapOf(Date)` now emit `format: 'date-time'` for their items, so a malformed date string is rejected instead of deserializing to `Invalid Date`.
