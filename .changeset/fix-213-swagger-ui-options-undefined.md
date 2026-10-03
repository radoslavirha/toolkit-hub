---
"@radoslavirha/tsed-swagger": patch
---

`SwaggerProvider` no longer crashes when `serverUrl` is set and `swaggerUIOptions` is `undefined`; it now treats the options as `{}` and auto-populates `urls`.
