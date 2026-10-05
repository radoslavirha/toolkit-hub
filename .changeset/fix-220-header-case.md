---
"@radoslavirha/redaction": patch
---

Root-level selectors in a `headers` profile field now match header names case-insensitively, so `Authorization` and `X-API-Key` are redacted.
