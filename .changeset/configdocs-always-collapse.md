---
"@radoslavirha/tsed-configuration": patch
---

`ConfigDocs.render` collapses at every depth instead of only the direct children of a section, with one rule and no size limit: every object-like child (a plain object, or the items of an array or map) gets its own closed `<details>` block, and the parent table keeps the child's own row. A union of objects is a closed `<details>` block summarised as `<key>: one of N`, and each of its variants is a closed block of its own. A union is printed in full wherever it occurs; the "same shapes as described above" back-reference is gone. A section's own table is never collapsed. Each `<details>` body is wrapped in a `<blockquote>`, which indents nested levels. A `CONFIGURATION.md` pinned by a file snapshot must be regenerated with `vitest -u`.
