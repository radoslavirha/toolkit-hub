---
"@radoslavirha/tsed-platform": major
"@radoslavirha/tsed-configuration": patch
"@radoslavirha/tsed-swagger": patch
"@radoslavirha/config-eslint": patch
"@radoslavirha/config-vitest": patch
---

Align `Platform.bootstrap` with the Ts.ED 8.38 `rootModule` API

**Breaking:** `Platform.bootstrap` now takes settings only — pass the server class as `rootModule` inside `ServerConfiguration`, the shape Ts.ED 8.38 documents:

```ts
// before
const platform = await Platform.bootstrap(Server, configuration);

// after
const platform = await Platform.bootstrap({ rootModule: Server, ...configuration });
```

**Breaking:** `Platform` no longer extends `PlatformExpress`. It never used the inheritance — the adapter comes from the settings — and the single-argument signature is incompatible with the base class static side. Inherited members such as `Platform.create()` are gone; use `PlatformExpress` directly if you need them.

`@tsed/platform-express@8.38.0` added a `bootstrap(settings)` overload, which made the previous two-argument override an invalid static-side override (`TS2417`).

Also bumps `config` to 5.0.1, `typescript-eslint` to 8.67.0 and `unplugin-swc` to 1.5.11.
