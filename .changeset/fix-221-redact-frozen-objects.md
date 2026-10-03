---
"@radoslavirha/redaction": patch
---

Redaction now censors configured paths in frozen objects (e.g. `Object.freeze`d DTOs, Immer/Redux state) instead of serialising their secrets in clear.
