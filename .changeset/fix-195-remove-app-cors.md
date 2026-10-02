---
"@radoslavirha/tsed-platform": patch
---

`BaseServer.registerMiddlewares()` no longer registers CORS (`origin: true` with credentials) or method override, so the app emits no `Access-Control-*` headers; CORS is left to the gateway. The `cors` and `method-override` dependencies are removed.
