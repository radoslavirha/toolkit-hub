---
description: A pre-persistence model must be built with buildModelCore, never the deprecated buildModel.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm working in a TypeScript service that depends on @radoslavirha/utils. Given
`class Model { id!: string; createdAt!: Date; updatedAt!: Date; name!: string }`, write a
function that builds a `Model` instance for a create request where only `name` is known —
id and timestamps are assigned by the database later. Reply with only the code.
