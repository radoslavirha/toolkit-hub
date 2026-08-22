---
'@radoslavirha/tsed-common': patch
'@radoslavirha/tsed-configuration': patch
'@radoslavirha/tsed-logger': patch
'@radoslavirha/tsed-mongoose': patch
'@radoslavirha/tsed-platform': patch
'@radoslavirha/tsed-swagger': patch
---

Move the Ts.ED catalog to 8.38.2 and stop routing `Platform.bootstrap` through `PlatformExpress.bootstrap(settings)`.

Ts.ED 8.38.2 funnels both `bootstrap()` overloads through `PlatformBuilder.options()`, which tells a root module from a settings object with `isClass()`. That helper returns `true` for plain objects — it only rejects `Object` itself — so a settings-only call is read as a root module and every key, `rootModule` included, is discarded. `Platform.bootstrap` now builds the `PlatformBuilder` directly, which is what the adapter did up to 8.38.0.
