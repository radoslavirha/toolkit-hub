---
"@radoslavirha/tsed-platform": patch
---

`BaseServer` now registers its middleware stack from its own `$beforeRoutesInit` hook, so overriding `registerMiddlewares()` and calling `super` works without a manual hook.
