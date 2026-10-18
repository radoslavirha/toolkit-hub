---
"@radoslavirha/tsed-logger": patch
---

Failed-request logs no longer carry the rejected value (`Given value: ...`) from `@tsed/ajv` validation errors in `error_message` and `error_stack`, which leaked fields configured in `redactPaths`.
