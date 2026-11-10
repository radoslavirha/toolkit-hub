---
"@radoslavirha/tsed-configuration": minor
---

`ConfigDocs.render` now prints each variant of a union as a closed `<details>` block instead of a heading, so pages with alternative shapes are shorter on GitHub. The `one of N` union heading stays visible. New option `collapseSections` (default `false`) also folds every top-level section's tables. A `CONFIGURATION.md` pinned by a file snapshot must be regenerated with `vitest -u`.
