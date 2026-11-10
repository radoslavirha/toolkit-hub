---
"@radoslavirha/tsed-configuration": minor
---

`ConfigDocs.render` output is now collapsible on GitHub. Each variant of a union is a closed `<details>` block instead of a heading; the `one of N` union heading stays visible. When two or more direct children of a top-level section expand into keys of their own (an object, a map or an array of objects), each child gets its own closed block holding its table and its unions, instead of one long section table with every union after it. New option `collapseSections` (default `false`) also folds every top-level section's body. A `CONFIGURATION.md` pinned by a file snapshot must be regenerated with `vitest -u`.
