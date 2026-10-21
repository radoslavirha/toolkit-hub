---
"@radoslavirha/logger": patch
---

Keep both values when metadata carries a reserved key and its `meta_<key>` name; the reserved key's value moves to `meta_meta_<key>` instead of overwriting.
