---
"@radoslavirha/tsed-swagger": patch
---

The landing page now accepts only `http` or `https` from `X-Forwarded-Proto` and falls back to `http` otherwise, so a crafted header can no longer inject a `javascript:` scheme into the page's links.
