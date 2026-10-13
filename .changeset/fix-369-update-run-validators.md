---
'@radoslavirha/tsed-mongoose': patch
---

`MongoRepository.updateByIdIfUnmodified` now runs schema validators, so an update that violates the schema rejects instead of persisting.
