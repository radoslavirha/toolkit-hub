---
"@radoslavirha/tsed-mongoose": patch
---

Ship agent guidance as an APM skill (`using-tsed-mongoose`): the document/model/mapper/repository contract, the members each base class requires, `mongoToModelBase` returning a value to spread rather than mutating, `getModelValue`'s PATCH flag, the `MongoCreate`/`MongoUpdate`/`MongoFilter` payload types, the `Ref` helpers, and the traps left by the renamed mapper and repository APIs.

Also corrects the package's own JSDoc, which taught two things the code no longer does: `MongoRepository`'s example declared `protected type: Type<Item> = Item` (renamed to `mongo`), and `MongoMapper` claimed three abstract methods when it declares two abstract properties, with an example that omitted both.
