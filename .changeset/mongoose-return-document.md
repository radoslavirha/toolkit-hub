---
"@radoslavirha/tsed-mongoose": patch
---

Replace deprecated `new: true` with `returnDocument: 'after'` in `findOneAndUpdate` calls, removing the Mongoose deprecation warning
