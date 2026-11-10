---
"@radoslavirha/tsed-configuration": patch
---

`ConfigDocs.render` collapses every expanding child of a section, also when it is the only one (e.g. `externalApis` with a single API), and collapses the items of a section that is itself an array or map of objects (e.g. `mcpServers[]`), unions included. Sections of plain values stay open tables. A `CONFIGURATION.md` pinned by a file snapshot must be regenerated with `vitest -u`.
