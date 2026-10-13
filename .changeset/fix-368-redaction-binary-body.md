---
"@radoslavirha/redaction": patch
---

Redact JSON held in a `Buffer` or `Uint8Array`: binary input is now decoded as UTF-8 text before redaction instead of being serialised as a byte array that bypassed `redactPaths`.
