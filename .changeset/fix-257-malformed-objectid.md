---
"@radoslavirha/tsed-mongoose": patch
---

Add a protected `MongoRepository.isValidId()` guard so by-id queries can resolve `null` for a malformed id instead of throwing a Mongoose `CastError`.
