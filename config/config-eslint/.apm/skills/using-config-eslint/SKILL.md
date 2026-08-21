---
name: using-config-eslint
description: Use when adding an eslint.config.mjs to a package, or when a lint rule needs disabling for a file or line. Covers the flat-config wrapper and where a rule change belongs.
---

# Using @radoslavirha/config-eslint

Flat config, one wrapper per package:

```ts ignore
import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';

export default defineConfig(...Config);
```

The default export is an array of flat-config objects, so it is **spread**, not nested. A
package that needs an extra rule appends its own object after the spread:

```ts ignore
export default defineConfig(...Config, {
    files: ['src/legacy/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
});
```

Scope an override as narrowly as the problem: prefer a targeted `files` pattern, then a
file-level comment, then a single-line disable with a reason. A blanket rule change in a
package's own config hides the problem from everywhere else that shares the config.

If a rule is wrong for the whole toolkit, change it in this package and release it — that is
the point of sharing the config.

## Reuse rules are not here

The rules that flag hand-rolled `=== null`, `typeof` tests, `Array.isArray` and
`JSON.parse(JSON.stringify(...))` ship from `@radoslavirha/utils/eslint`, because every
message names a method of that package — keeping them together means a project can never be
advised to call something its installed version does not have.

```ts ignore
export default defineConfig(...Config, ...PreferUtils);
```

Enable it in any package that depends on `utils`. See the `using-utils` skill.
