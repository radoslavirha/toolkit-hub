---
'@radoslavirha/tsed-mongoose': patch
---

`updateByIdIfUnmodified` resolves `conflict` (or `not-found`) for an `Invalid Date` `expectedUpdatedAt` instead of rejecting with a `CastError`.
