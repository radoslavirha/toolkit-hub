---
"@radoslavirha/config-tsdown": patch
---

Replace the deprecated `deps.skipNodeModulesBundle` with `deps.neverBundle: true`

Both `cjsConfig` and `esmConfig` set the option, so every consumer printed the deprecation warning twice per package build:

```
WARN `deps.skipNodeModulesBundle` is deprecated. Use `deps.neverBundle: true` instead.
```

Behaviour is unchanged — `neverBundle: true` externalizes all dependencies, which is what the old option did. `neverBundle: true` requires tsdown `>= 0.22.13`; the catalog pins `0.22.14`.
