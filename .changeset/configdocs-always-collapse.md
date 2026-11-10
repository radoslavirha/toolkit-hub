---
"@radoslavirha/tsed-configuration": patch
---

`ConfigDocs.render` collapses by size at every depth instead of only the direct children of a section. An object-like child (a plain object, or the items of an array or map) gets its own closed `<details>` block, with its unions and its own big children inside, when its table would hold more than `collapseThreshold` rows (new option, default `5`; `Infinity` turns it off). Smaller children stay inline, and the parent table keeps the child's own row. A section's own table is never collapsed, and union variants still always are. A `CONFIGURATION.md` pinned by a file snapshot must be regenerated with `vitest -u`.
