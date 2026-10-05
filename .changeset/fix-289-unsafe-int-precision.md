---
"@radoslavirha/redaction": patch
---

Redacting JSON text no longer rounds integers above `Number.MAX_SAFE_INTEGER`; unredacted IDs keep their original digits.
