---
name: using-config-tsdown
description: Use when setting up a build for a library package, adding a tsdown.config.ts, or wondering why a package ships both ESM and CJS output. Covers the two exported configs and what they already handle.
---

# Using @radoslavirha/config-tsdown

Library packages build dual ESM + CJS with declarations, from one line:

```ts ignore
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsdown';
import { defineConfig } from 'tsdown';

export default defineConfig([cjsConfig, esmConfig]);
```

Both configs already set: entry `src/index.ts`, `dts: true`, `clean: true`, the package's own
`tsconfig.json`, and `skipNodeModulesBundle` so dependencies are not inlined. `esmConfig`
outputs to `dist/esm`, `cjsConfig` to `dist/cjs` — matching the `exports` map in
`package.json`.

Do not re-specify those options in a package. If an entry point or format genuinely differs,
spread the shared config and override the one field rather than writing a config from scratch.

Applies to **library packages only**. Applications are bundled by their own toolchain, and a
type-only package (like `@radoslavirha/types`, which publishes its sources) needs no build at
all.
