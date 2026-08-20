---
name: using-config-vitest
description: Use when adding a vitest.config.ts to a package, changing coverage thresholds, excluding files from coverage, or setting up MongoDB testcontainers in tests. Covers the thin-wrapper pattern, the three coverage presets, and why the shared base config is never edited.
---

# Using @radoslavirha/config-vitest

Every package gets a **thin wrapper**, never a copied config:

```ts ignore
import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(mergeConfig(defaultConfig, {}));
```

`mergeConfig` is what keeps the shared parts shared. Replacing `defaultConfig` with a
hand-written object detaches the package from every future change to the base.

## Coverage presets

`Coverage90`, `Coverage95`, `Coverage100` — all metrics at that percentage. `Coverage95` is
the default choice for a package; `Coverage100` is reasonable for small pure-function
packages.

## Package-specific overrides

Add them in the merge object, not the base:

```ts ignore
export default defineConfig(mergeConfig(defaultConfig, {
    test: {
        globalSetup: [import.meta.resolve('@tsed/testcontainers-mongo/vitest/setup')],
        coverage: {
            exclude: ['src/models', 'src/test', 'src/types']
        }
    }
}));
```

- Packages with Ts.ED DI models or test helpers exclude `src/models`, `src/test`, `src/types`
  from coverage — decorated declarations have no meaningful branches to cover.
- Packages touching MongoDB add the testcontainers `globalSetup`, resolved through
  `import.meta.resolve` so it works from both source and build output.

Never edit the shared base config to satisfy one package. If a change genuinely belongs to
every package, change the base deliberately and release it.
