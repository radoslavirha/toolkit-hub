---
description: A repository by-id query must be guarded with isValidId and deserialize its result.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm working in a Ts.ED service that uses @radoslavirha/tsed-mongoose. There is a Mongoose
document class `ItemMongo` with a `name` field. Write the repository for it with a
`findById(id: string)` method; the id comes straight from the URL path. Reply with only the
code.
