---
"@radoslavirha/tsed-mongoose": minor
---

Add opt-in optimistic concurrency: `MongoRepository.updateByIdIfUnmodified` applies an update only if `updatedAt` is unchanged and resolves a `MongoConcurrentUpdateResult` (`updated` / `conflict` / `not-found`).
