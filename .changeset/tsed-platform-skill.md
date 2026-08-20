---
"@radoslavirha/tsed-platform": patch
---

Ship agent guidance as an APM skill (`using-tsed-platform`): `Platform.bootstrap` and the required `api` metadata, extending `BaseServer` and overriding `registerMiddlewares` rather than rebuilding the stack, the `execute`/`performOperation` split, mounting controllers by value instead of by glob, resolving configuration through the injector, and the `BaseHandler` constructor mistake.
