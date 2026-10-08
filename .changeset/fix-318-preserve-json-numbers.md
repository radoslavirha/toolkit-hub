---
"@radoslavirha/redaction": patch
---

Redacting JSON text now keeps high-precision decimals and out-of-range number literals as received instead of rounding them or logging `null`.
