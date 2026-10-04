---
"@radoslavirha/tsed-common": patch
---

`ZodValidator.validate` now infers its return type from the schema and rejects a mismatching explicit type argument; primitive and array schemas are accepted.
