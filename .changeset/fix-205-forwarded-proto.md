---
"@radoslavirha/tsed-swagger": patch
---

Docs landing page links now use the first (client-facing) `X-Forwarded-Proto` value when chained proxies send a comma-separated list, instead of rendering `https,http://…`.
