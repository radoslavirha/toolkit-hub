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

## Toolkit reuse rules

A separate opt-in config warns when code hand-rolls something `@radoslavirha/utils` already
provides — raw `=== null`, `typeof x === 'string'`, `Array.isArray`,
`JSON.parse(JSON.stringify(...))`, or a lodash import:

```ts ignore
export default defineConfig(...Config, ...ToolkitReuse);
```

It is opt-in rather than part of the base config because every message names a method the
project has to be able to import. Do not enable it in a package that does not depend on
`utils` — including `utils` itself, which implements those primitives, and `redaction`, which
is deliberately dependency-light.

All rules are `warn`. `x == null` is not flagged: loose equality covers both null and
undefined and is a deliberate choice, not an oversight.
