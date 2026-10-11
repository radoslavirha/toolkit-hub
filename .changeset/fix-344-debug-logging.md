---
'@radoslavirha/tsed-common': patch
---

Fix `ZodValidator` and `JSONSchemaValidator` throwing a `TypeError` from debug logging when the input contains a bigint or a circular reference.
