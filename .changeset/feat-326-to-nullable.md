---
"@radoslavirha/utils": minor
"@radoslavirha/tsed-mongoose": minor
---

Add `MappingUtils.toNullable` to normalise `null`/missing values read from storage to `null`, and document the read/write rules for nullable fields in the `using-utils` and `using-tsed-mongoose` skills. `buildMongoUpdatePayload` keeping `null` is now pinned by a test.
