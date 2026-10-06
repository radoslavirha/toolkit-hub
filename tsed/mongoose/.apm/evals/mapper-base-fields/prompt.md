---
description: A mapper spreads the returned mongoToModelBase(mongo) instead of the old mutating form.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm working in a Ts.ED service that uses @radoslavirha/tsed-mongoose and
@radoslavirha/tsed-common. Write the mapper between the Mongoose document `ItemMongo`
(field `name`) and the API model `ItemModel` (field `name`), including the create and
update payload methods. Reply with only the code.
