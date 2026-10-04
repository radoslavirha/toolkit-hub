---
"@radoslavirha/utils": patch
---

`CommonUtils.buildModelCore` now drops `id`, `_id`, `createdAt` and `updatedAt` from the data at runtime, as documented, instead of only in the type.
